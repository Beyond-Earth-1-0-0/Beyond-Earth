from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import pandas as pd
import io, os, joblib
import re, smtplib, ssl, random, string, time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import sys

# Add the project's root directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from server.models.notebook.KOI import train_and_save_model

app = FastAPI()
# Mount the uploading folder as static
app.mount("/client", StaticFiles(directory="../../client"), name="client")

# ======== CORS ========
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================
# ========== OTP PART ==========
# =============================
OTP_FILE = "../otps.txt"

def load_otps() -> dict:
    if not os.path.exists(OTP_FILE):
        return {}
    otps = {}
    with open(OTP_FILE, "r") as f:
        for line in f:
            parts = line.strip().split(",")
            if len(parts) == 3:
                otp, email, expiry = parts
                otps[otp] = {"email": email, "expiry": float(expiry)}
    return otps

def save_otps(otps: dict):
    with open(OTP_FILE, "w") as f:
        for otp, info in otps.items():
            f.write(f"{otp},{info['email']},{info['expiry']}\n")

def cleanup_otps() -> dict:
    otps = load_otps()
    now = time.time()
    valid_otps = {otp: info for otp, info in otps.items() if info["expiry"] > now}
    save_otps(valid_otps)
    return valid_otps

# ======== EMAIL VALIDATION ========
def validate_email(email: str) -> bool:
    # pattern = r"^[0-9]{10}@cis\.asu\.edu\.eg$"
    pattern = r"^[a-zA-Z]+(?:\.[a-zA-Z]+)?\d{2}@eng-st\.cu\.edu\.eg$"
    return re.match(pattern, email) is not None

# ======== GENERATE OTP ========
def generate_unique_otp(email: str, length: int = 6, expiry_seconds: int = 120) -> tuple[str, float]:
    otps = cleanup_otps()
    while True:
        otp = ''.join(random.choices(string.digits, k=length))
        if otp not in otps:
            expiry_time = time.time() + expiry_seconds
            otps[otp] = {"email": email, "expiry": expiry_time}
            save_otps(otps)
            return otp, expiry_time

# ======== SEND EMAIL ========
def send_otp_email(receiver_email: str, otp: str, sender_email: str, sender_password: str):
    message = MIMEMultipart("alternative")
    message["Subject"] = "Your OTP Code"
    message["From"] = sender_email
    message["To"] = receiver_email

    text = f"Your OTP code is: {otp}\nThis code will expire in 2 minutes."
    html = f"<p>Your OTP code is: <b>{otp}</b><br><i>This code will expire in 2 minutes.</i></p>"

    message.attach(MIMEText(text, "plain"))
    message.attach(MIMEText(html, "html"))

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, receiver_email, message.as_string())

# ======== VERIFY OTP ========
def verify_otp(user_input: str, email: str) -> bool:
    otps = cleanup_otps()
    if user_input in otps and otps[user_input]["email"] == email:
        del otps[user_input]
        save_otps(otps)
        return True
    return False

# ======== FASTAPI ENDPOINTS ========
@app.post("/send-otp")
def send_otp_endpoint(email: str = Form(...)):
    sender_email = "beyondearthteam1@gmail.com"
    sender_password = "ybkn qrcj zjgn svcf"  # Replace with your Gmail App Password
    
    if not validate_email(email):
        return {"success": False, "message": "Invalid email format. Must be: 10digits@cis.asu.edu.eg"}

    otp, _ = generate_unique_otp(email)
    try:
        send_otp_email(email, otp, sender_email, sender_password)
        return {"success": True, "message": f"OTP sent to {email}"}
    except Exception as e:
        return {"success": False, "message": f"Failed to send OTP: {str(e)}"}

@app.post("/verify-otp")
def verify_otp_endpoint(otp: str = Form(...), email: str = Form(...)):
    if verify_otp(otp, email):
        return {"success": True, "message": "OTP verified successfully"}
    return {"success": False, "message": "Invalid or expired OTP"}


# =============================
# ========== PREDICT PART =====
# =============================
ORIGINAL_DATASET_PATH = "../models/notebook/original_dataset.csv"
MERGE_FOLDER = "../models/merged_datasets"
PREDICTION_FOLDER = "../models/prediction_inputs"
RESULTS_FILE = f"{PREDICTION_FOLDER}/predictions_with_ids.csv"


MODEL_PATH = "../models/saved_model/best_model.pkl"
IMPUTER_PATH = "../models/saved_model/imputer.pkl"
SCALER_PATH = "../models/saved_model/scaler.pkl"
SELECTOR_PATH = "../models/saved_model/selector.pkl"

os.makedirs(MERGE_FOLDER, exist_ok=True)
os.makedirs(PREDICTION_FOLDER, exist_ok=True)


# =============================
# Load Trained Model + Preprocessing
# =============================
try:
    model = joblib.load(MODEL_PATH)
    imputer = joblib.load(IMPUTER_PATH)
    scaler = joblib.load(SCALER_PATH)
    selector = joblib.load(SELECTOR_PATH)
    print("✅ Loaded trained model and preprocessing objects.")
except Exception as e:
    print("⚠️ Warning: Could not load model or preprocessing files.", str(e))
    model, imputer, scaler, selector = None, None, None, None

# =============================
# Expected Schema
# =============================
EXPECTED_SCHEMA = {
    "kepid": "int64",
    "kepoi_name": "object",
    "kepler_name": "object",
    "koi_disposition": "object",
    "koi_pdisposition": "object",
    "koi_score": "float64",
    "koi_fpflag_nt": "int64",
    "koi_fpflag_ss": "int64",
    "koi_fpflag_co": "int64",
    "koi_fpflag_ec": "int64",
    "koi_period": "float64",
    "koi_period_err1": "float64",
    "koi_period_err2": "float64",
    "koi_time0bk": "float64",
    "koi_time0bk_err1": "float64",
    "koi_time0bk_err2": "float64",
    "koi_impact": "float64",
    "koi_impact_err1": "float64",
    "koi_impact_err2": "float64",
    "koi_duration": "float64",
    "koi_duration_err1": "float64",
    "koi_duration_err2": "float64",
    "koi_depth": "float64",
    "koi_depth_err1": "float64",
    "koi_depth_err2": "float64",
    "koi_prad": "float64",
    "koi_prad_err1": "float64",
    "koi_prad_err2": "float64",
    "koi_teq": "float64",
    "koi_teq_err1": "float64",
    "koi_teq_err2": "float64",
    "koi_insol": "float64",
    "koi_insol_err1": "float64",
    "koi_insol_err2": "float64",
    "koi_model_snr": "float64",
    "koi_tce_plnt_num": "int64",
    "koi_tce_delivname": "object",
    "koi_steff": "float64",
    "koi_steff_err1": "float64",
    "koi_steff_err2": "float64",
    "koi_slogg": "float64",
    "koi_slogg_err1": "float64",
    "koi_slogg_err2": "float64",
    "koi_srad": "float64",
    "koi_srad_err1": "float64",
    "koi_srad_err2": "float64",
    "ra": "float64",
    "dec": "float64",
    "koi_kepmag": "float64"
}

# =============================
# Helper: Schema Validation
# =============================
def validate_schema(df: pd.DataFrame, check_target: bool = True):
    """Validate file schema (columns + dtypes).
       If check_target=False, koi_disposition is excluded from expected schema."""
    
    expected_cols = set(EXPECTED_SCHEMA.keys())
    if not check_target:
        expected_cols = expected_cols - {"koi_disposition"}  # remove for prediction
    
    if set(df.columns) != expected_cols:
        return False, "Invalid schema"
    
    for col in expected_cols:
        expected_dtype = EXPECTED_SCHEMA[col]
        if col == "koi_tce_plnt_num":
            if str(df[col].dtype) not in ["float64", "int64"]:
                return False, f"Invalid dtype for {col}"
        elif str(df[col].dtype) != expected_dtype:
                return False, f"Invalid dtype for {col}"

    
    if not check_target and "koi_disposition" in df.columns:
        return False, "Prediction file must NOT contain 'koi_disposition'."
    
    return True, None

# =============================
# Upload / Predict Endpoint
# =============================
@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    action: str = Form(...)
):
    if not file.filename.lower().endswith(".csv"):
        return JSONResponse(status_code=400, content={"status": "error", "message": "Only CSV files are allowed."})

    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        return JSONResponse(status_code=400, content={"status": "error", "message": f"Invalid CSV file: {str(e)}"})

    # Reload original dataset from disk every time
    try:
        original_df = pd.read_csv(ORIGINAL_DATASET_PATH)
    except FileNotFoundError:
        original_df = pd.DataFrame()

    # ========== Upload ==========
    if action == "upload":
        valid, msg = validate_schema(df, check_target=True)
        if not valid:
            return JSONResponse(status_code=400, content={"status": "error", "message": msg})

        merged = pd.concat([original_df, df], ignore_index=True)
        merged_path = os.path.join(MERGE_FOLDER, "merged.csv")
        merged.to_csv(merged_path, index=False)
        # Overwrite the original dataset file
        merged.to_csv(ORIGINAL_DATASET_PATH, index=False)

        # 🔥 Retrain model after upload
        try:
            best_model, best_name, best_score = train_and_save_model(merged_path, save_path="../models/saved_model")
            return JSONResponse(status_code=200, content={
                "status": "success",
                "message": f"File uploaded, merged, and model retrained. Best model: {best_name} (F1={best_score:.4f})",
                "rows_uploaded": len(df),
                "rows_total_after_merge": len(merged),
            })
        except Exception as e:
            return JSONResponse(status_code=500, content={
                "status": "error",
                "message": f"Upload merged but failed to train model: {str(e)}"
            })

    # ========== Predict ==========
    elif action == "predict":
        valid, msg = validate_schema(df, check_target=False)
        if not valid:
            return JSONResponse(status_code=400, content={"status": "error", "message": msg})

        if model is None or imputer is None or scaler is None or selector is None:
            return JSONResponse(status_code=500, content={"status": "error", "message": "Model or preprocessing files not loaded. Train and save them first."})


        # === Apply training preprocessing ===
        error_cols = [
            'koi_period', 'koi_time0bk', 'koi_impact',
            'koi_duration', 'koi_depth',
            'koi_prad', 'koi_teq', 'koi_insol',
            'koi_steff', 'koi_slogg', 'koi_srad',
        ]
        for col in error_cols:
            err1 = df.get(col + "_err1", pd.Series(0, index=df.index)).fillna(0)
            err2 = df.get(col + "_err2", pd.Series(0, index=df.index)).fillna(0)
            df[col] = df[col].fillna(0) + (err1 + err2) / 2

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
        df_processed = df.drop(columns=[c for c in drop_cols if c in df.columns], errors="ignore")

        # Apply pipeline
        X_imp = imputer.transform(df_processed)
        X_scaled = scaler.transform(X_imp)
        X_selected = selector.transform(X_scaled)

        preds = model.predict(X_selected)
        label_map = {1: "CONFIRMED", 0: "FALSE POSITIVE", 2: "CANDIDATE"}
        df["prediction"] = [label_map.get(p, "UNKNOWN") for p in preds]

        save_cols = ["kepid", "prediction"] if "kepid" in df.columns else ["prediction"]
        df[save_cols].to_csv(
            RESULTS_FILE, mode="w", header=not os.path.exists(RESULTS_FILE), index=False
        )

        return JSONResponse(status_code=200, content={
            "status": "success",
            "message": "Predictions generated successfully.",
            "rows_uploaded": len(df),
            "predictions": df[save_cols].to_dict(orient="records")
        })

    else:
        return JSONResponse(status_code=400, content={"status": "error", "message": "Invalid action. Must be 'upload' or 'predict'."})

# =============================
# Query by ID Endpoint
# =============================
@app.get("/get_result/{kepid}")
async def get_result(kepid: int):
    if not os.path.exists(RESULTS_FILE):
        return JSONResponse(status_code=404, content={"status": "error", "message": "No predictions stored yet."})

    df = pd.read_csv(RESULTS_FILE)

    if "kepid" not in df.columns:
        return JSONResponse(status_code=400, content={"status": "error", "message": "Predictions were saved without IDs."})

    row = df[df["kepid"] == kepid]
    if row.empty:
        return JSONResponse(status_code=404, content={"status": "error", "message": f"No prediction found for kepid {kepid}."})

    return JSONResponse(status_code=200, content={
        "status": "success",
        "kepid": int(row.iloc[0]["kepid"]),
        "prediction": row.iloc[0]["prediction"]
    })
    
# =============================
# ========== DATASET PART =====
# =============================


# Columns you want to include in the response
COLUMNS_TO_INCLUDE = [
    "kepoi_name",
    "koi_disposition",
    "koi_score",
    "koi_period",
    "koi_time0bk",
    "koi_impact",
    "koi_duration",
    "koi_depth",
    "koi_teq"
]

@app.get("/dataset")
def get_dataset(num_rows: int = Query(default=None, ge=1, description="Number of rows to retrieve")):
    """
    Fetch dataset from CSV.
    - num_rows: optional, number of rows to return. Defaults to all rows.
    - Replaces null values in numeric columns (int/float) with 0.
    - Removes outliers using IQR method.
    """
    if not os.path.exists(ORIGINAL_DATASET_PATH):
        raise HTTPException(status_code=404, detail="CSV file not found")

    try:
        df = pd.read_csv(ORIGINAL_DATASET_PATH)
        df = df[COLUMNS_TO_INCLUDE]

        # =============================
        # ===== Handle Null Values =====
        # =============================
        numeric_cols = df.select_dtypes(include=["float64", "int64"]).columns
        df[numeric_cols] = df[numeric_cols].fillna(0)

        # =============================
        # ====== Remove Outliers =======
        # =============================
        def remove_outliers_iqr(dataframe, columns):
            for col in columns:
                Q1 = dataframe[col].quantile(0.25)
                Q3 = dataframe[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                dataframe = dataframe[(dataframe[col] >= lower_bound) & (dataframe[col] <= upper_bound)]
            return dataframe

        df = remove_outliers_iqr(df, numeric_cols)

        # =============================
        # ===== Limit Rows if Any ======
        # =============================
        if num_rows is not None and num_rows < len(df):
            df = df.head(num_rows)

        data = df.to_dict(orient="records")
        return {"data": data, "rows": len(data)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))