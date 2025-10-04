# Exoplanet Chatbot Integration Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Start the Flask Server

```bash
python app.py
```

The server will start at `http://127.0.0.1:5000`

### 3. Open Your Web Application

Open your HTML file with the Planet Tutor integrated. The chatbot will automatically connect to the Flask server.

---

## 📁 File Structure

```
your-project/
├── app.py                          # Flask server
├── requirements.txt                # Python dependencies
├── fine_tuned_roki/               # Your trained model directory
│   ├── config.json
│   ├── pytorch_model.bin
│   └── token