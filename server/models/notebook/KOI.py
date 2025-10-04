import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score, f1_score, classification_report
)
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.feature_selection import SelectKBest, mutual_info_classif


# ==========================================================
# 1. Preprocessing function (shared)
# ==========================================================
def preprocess_data(data_set: pd.DataFrame, fit: bool = True,
                    imputer=None, scaler=None, selector=None):
    """
    Preprocess dataset: handle errors, drop unused cols, impute, scale, select features.
    If fit=False → use provided imputer, scaler, selector instead of fitting new ones.
    """

    # ----- Handle error columns -----
    error_cols = [
        'koi_period', 'koi_time0bk', 'koi_impact',
        'koi_duration', 'koi_depth',
        'koi_prad', 'koi_teq', 'koi_insol',
        'koi_steff', 'koi_slogg', 'koi_srad',
    ]
    for col in error_cols:
        err1 = data_set.get(col + "_err1", pd.Series(0, index=data_set.index)).fillna(0)
        err2 = data_set.get(col + "_err2", pd.Series(0, index=data_set.index)).fillna(0)
        if col in data_set.columns:
            data_set[col] = data_set[col].fillna(0) + (err1 + err2) / 2

    # ----- Drop unnecessary columns -----
    drop_cols = [
        "kepid", "kepoi_name", "kepler_name",
        "koi_pdisposition", "koi_score", "koi_tce_delivname",
        "koi_period_err1","koi_period_err2","koi_time0bk_err1","koi_time0bk_err2",
        "koi_impact_err1","koi_impact_err2","koi_depth_err1","koi_depth_err2",
        "koi_prad_err1","koi_prad_err2","koi_teq_err1","koi_teq_err2",
        "koi_steff_err1","koi_steff_err2","koi_slogg_err1","koi_slogg_err2",
        "koi_srad_err1","koi_srad_err2","koi_duration_err1","koi_duration_err2",
        "koi_insol_err1","koi_insol_err2"
    ]
    data_set = data_set.drop(columns=drop_cols, axis=1, errors="ignore")

    # ----- Encode labels -----
    if "koi_disposition" in data_set.columns:
        data_set["koi_disposition"] = data_set["koi_disposition"].map({
            'CONFIRMED': 1, 'FALSE POSITIVE': 0, 'CANDIDATE': 2
        })

    data_set = data_set.drop_duplicates()

    y = data_set['koi_disposition'] if "koi_disposition" in data_set.columns else None
    X = data_set.drop("koi_disposition", axis=1, errors="ignore")

    # ----- Impute -----
    if fit:
        imputer = SimpleImputer(strategy='median')
        X = imputer.fit_transform(X)
    else:
        X = imputer.transform(X)

    # ----- Scale -----
    if fit:
        scaler = MinMaxScaler()
        X = scaler.fit_transform(X)
    else:
        X = scaler.transform(X)

    # ----- Feature selection -----
    n_features = min(20, X.shape[1])
    if fit:
        selector = SelectKBest(score_func=mutual_info_classif, k=n_features)
        if y is not None:
            X = selector.fit_transform(X, y)
        else:
            X = selector.fit_transform(X, np.zeros(len(X)))
    else:
        X = selector.transform(X)

    return X, y, imputer, scaler, selector


# ==========================================================
# 2. Training
# ==========================================================
def train_and_save_model(csv_path: str, save_path: str = "../saved_model"):
    data = pd.read_csv(csv_path)

    # Preprocess (fit=True)
    X, y, imputer, scaler, selector = preprocess_data(data, fit=True)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=123, stratify=y
    )

    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=123),
        "Random Forest": RandomForestClassifier(n_estimators=100, random_state=123),
        "SVM": SVC(kernel='rbf', probability=True, random_state=123),
        "Gradient Boosting": GradientBoostingClassifier(n_estimators=100, random_state=123),
        "KNN": KNeighborsClassifier(n_neighbors=5)
    }

    best_model, best_name, best_score = None, None, 0.0
    for name, model in models.items():
        print(f"\nTraining {name}...")
        model.fit(X_train, y_train)
        preds = model.predict(X_test)

        f1 = f1_score(y_test, preds, average="weighted")
        acc = accuracy_score(y_test, preds)
        print(f" -> Accuracy {acc:.4f}, F1 {f1:.4f}")

        if f1 > best_score:
            best_model, best_name, best_score = model, name, f1

    print(f"\n✅ Best model: {best_name} with F1 = {best_score:.4f}")

    # Save preprocessing pipeline + model
    os.makedirs(save_path, exist_ok=True)
    joblib.dump(best_model, os.path.join(save_path, "best_model.pkl"))
    joblib.dump(imputer, os.path.join(save_path, "imputer.pkl"))
    joblib.dump(scaler, os.path.join(save_path, "scaler.pkl"))
    joblib.dump(selector, os.path.join(save_path, "selector.pkl"))

    return best_model, best_name, best_score


# ==========================================================
# 3. Evaluation
# ==========================================================
def evaluate_model_with_csv(
    csv_path: str,
    model_path: str = "../saved_model",
    output_path: str = "./predictions.csv"
):
    # Load dataset
    data = pd.read_csv(csv_path)

    # Ground truth mapping
    label_map = {"CONFIRMED": 1, "FALSE POSITIVE": 0, "CANDIDATE": 2}
    reverse_map = {v: k for k, v in label_map.items()}

    # Load preprocessing + model
    imputer = joblib.load(os.path.join(model_path, "imputer.pkl"))
    scaler = joblib.load(os.path.join(model_path, "scaler.pkl"))
    selector = joblib.load(os.path.join(model_path, "selector.pkl"))
    model = joblib.load(os.path.join(model_path, "best_model.pkl"))

    # Apply preprocessing with saved transformers
    X, _, _, _, _ = preprocess_data(
        data,
        fit=False,
        imputer=imputer,
        scaler=scaler,
        selector=selector
    )

    # Predict
    preds = model.predict(X)

    

    # Save predictions with readable labels
    results_df = pd.DataFrame({
        "kepid": data["kepid"],
        "predicted_label": [reverse_map[p] for p in preds]
    })


    results_df.to_csv(output_path, index=False)
    print(f"✅ Predictions + probabilities saved to {output_path}")
    return preds




# ==========================================================
# 4. Run train then test
# ==========================================================
if __name__ == "__main__":
    best_model, best_name, best_score = train_and_save_model("../merged_datasets/merged.csv")
    
