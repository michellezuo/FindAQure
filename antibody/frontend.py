from flask import Flask, render_template, request
import requests

app = Flask(__name__)

FASTAPI_URL = "http://localhost:8000/api/quantum_antibody_search"

@app.route('/how_grovers_works')
def how_grovers_works():
    return render_template("how_grovers_works.html")

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        antigen_id = request.form.get("antigen_id", "").strip() or "Custom_Antigen"
        antigen_seq = request.form.get("antigen_seq", "").strip().upper()
        antibodies_raw = request.form.get("antibodies", "").strip()

        if not antigen_seq or not antibodies_raw:
            error = "Please enter an antigen sequence and at least one antibody."
            return render_template("index.html", error=error)

        antibodies = []
        for line in antibodies_raw.splitlines():
            line = line.strip()
            if not line:
                continue
            # format: name:SEQUENCE or just SEQUENCE
            if ":" in line:
                ab_id, seq = line.split(":", 1)
                ab_id = ab_id.strip()
                seq = seq.strip().upper()
            else:
                seq = line.upper()
                ab_id = f"Ab_{len(antibodies)+1}"
            antibodies.append({"id": ab_id, "sequence": seq})

        payload = {
            "antigen": {"id": antigen_id, "sequence": antigen_seq},
            "antibodies": antibodies,
        }

        try:
            resp = requests.post(FASTAPI_URL, json=payload)
            resp.raise_for_status()
            result = resp.json()
        except Exception as e:
            return render_template(
                "index.html",
                error=f"Error contacting quantum backend: {e}"
            )

        return render_template("results.html", result=result, antigen_seq=antigen_seq)

    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True, port=5000)
