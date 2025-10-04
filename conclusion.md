## Proof of Model Performance & Dataset Reliability

### Accuracy Results

* **Kepler Objects of Interest (KOI dataset)**: **93.3%** accuracy
* **K2 Planets & Candidates dataset (Test Data)**: **96.5%** accuracy

---

### Dataset Sources (NASA Exoplanet Archive)

* **Training Data**

  * **Kepler Objects of Interest (KOI)**

    * Comprehensive dataset of confirmed exoplanets, candidates, and false positives from the **Kepler mission**.
    * Classification via **“Disposition Using Kepler Data”** column.
    * 🔗 [KOI Dataset (Training)](https://exoplanetarchive.ipac.caltech.edu/cgi-bin/TblView/nph-tblView?app=ExoTbls&config=cumulative)


  * **K2 Planets and Candidates**

    * List of confirmed exoplanets, planetary candidates, Refused, and false positives from the **K2 mission**.
    * Classification via **“Disposition Using K2 Data”** column.
    * 🔗 [K2 Dataset](https://exoplanetarchive.ipac.caltech.edu/cgi-bin/TblView/nph-tblView?app=ExoTbls&config=k2pandc)

* **Test Data**

  * **Kepler Dataset**
    * Independent dataset of exoplanet candidates and confirmed exoplanets from the Kepler mission.

    * 🔗 [Kepler Dataset (Test)](https://exoplanetarchive.ipac.caltech.edu/)

---

### 🛠️ Techniques Used

* **Data Cleaning & Feature Engineering**

  * Handling missing values (median/mode imputation)
  * Removing duplicates and non-informative columns
  * Aggregating error columns (`err1`, `err2`)

* **Preprocessing**

  * Scaling (**StandardScaler**, **MinMaxScaler**)
  * Encoding categorical features (**OneHotEncoder / LabelEncoder**)
  * Feature selection (**SelectKBest with Mutual Information**)

* **Class Balancing**

  * **SMOTE (Synthetic Minority Oversampling)** to handle class imbalance

* **Models Trained**

  * **Random Forest Classifier**
  * **XGBoost Classifier**
  * Other tested: Logistic Regression, SVM, Gradient Boosting, KNN

* **Evaluation Metrics**

  * **Accuracy**
  * **Weighted F1-Score**
  * **Classification Report**

---

### 🎯 Key Points

* Both **training** and **testing** datasets are from **NASA Exoplanet Archive → trusted scientific source**.
* Achieved **93.3% (KOI)** and **96.5% (K2)** accuracy → strong evidence of robustness.
* End-to-end ML pipeline: **Preprocessing → Balancing → Feature Selection → Ensemble Models → Evaluation**.


