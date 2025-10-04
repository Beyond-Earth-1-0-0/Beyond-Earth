from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# --------------------
# Load fine-tuned model
# --------------------
MODEL_PATH = "./fine_tuned_roki"
print("Loading model from:", MODEL_PATH)

try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    model = AutoModelForCausalLM.from_pretrained(MODEL_PATH)
    model.eval()  # eval mode
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    tokenizer = None
    model = None

# --------------------
# Chat function with context
# --------------------
def generate_answer(user_input, planet_name=None, max_length=200):
    """
    Generate an answer based on user input and optional planet context
    """
    if not model or not tokenizer:
        return "Model not loaded. Please check the server logs."
    
    # Add planet context to the prompt if provided
    if planet_name:
        prompt = f"Question about exoplanet {planet_name}: {user_input}\nAnswer:"
    else:
        prompt = f"Question: {user_input}\nAnswer:"
    
    try:
        # Encode input
        inputs = tokenizer.encode(prompt + tokenizer.eos_token, return_tensors="pt")
        
        # Generate continuation
        with torch.no_grad():
            outputs = model.generate(
                inputs,
                max_length=max_length,
                pad_token_id=tokenizer.eos_token_id,
                do_sample=True,
                top_k=50,
                top_p=0.9,
                temperature=0.7,
                num_return_sequences=1
            )
        
        # Decode only the generated part (skip the prompt)
        response = tokenizer.decode(outputs[:, inputs.shape[-1]:][0], skip_special_tokens=True)
        
        # Clean up the response
        response = response.strip()
        
        # Remove any incomplete sentences at the end
        if response and response[-1] not in '.!?':
            last_period = max(response.rfind('.'), response.rfind('!'), response.rfind('?'))
            if last_period > 0:
                response = response[:last_period + 1]
        
        return response if response else "I'm not sure how to answer that. Could you rephrase your question?"
        
    except Exception as e:
        print(f"Error generating response: {e}")
        return "I encountered an error while processing your question. Please try again."

# --------------------
# Flask routes
# --------------------
@app.route("/")
def index():
    """
    Health check endpoint
    """
    return jsonify({
        "status": "online",
        "model_loaded": model is not None,
        "message": "Exoplanet Chatbot API is running"
    })

@app.route("/api", methods=["POST"])
def api():
    """
    Main chatbot endpoint
    Expects JSON: {"message": "user question", "planet": "planet name (optional)"}
    """
    try:
        data = request.json
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        message = data.get("message", "").strip()
        planet = data.get("planet", None)
        
        if not message:
            return jsonify({"error": "No message provided"}), 400
        
        # Generate response
        response = generate_answer(message, planet)
        
        return jsonify({
            "content": response,
            "planet": planet,
            "success": True
        })
        
    except Exception as e:
        print(f"API Error: {e}")
        return jsonify({
            "error": "Internal server error",
            "content": "I'm having trouble processing your request. Please try again.",
            "success": False
        }), 500

@app.route("/health", methods=["GET"])
def health():
    """
    Detailed health check
    """
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
        "tokenizer_loaded": tokenizer is not None,
        "model_path": MODEL_PATH
    })

if __name__ == "__main__":
    print("\n" + "="*50)
    print("🚀 Exoplanet Chatbot Server Starting...")
    print("="*50)
    print(f"Model Status: {'✓ Loaded' if model else '✗ Not Loaded'}")
    print("Server running on: http://127.0.0.1:5000")
    print("API endpoint: http://127.0.0.1:5000/api")
    print("="*50 + "\n")
    
    app.run(debug=True, host="0.0.0.0", port=5000)