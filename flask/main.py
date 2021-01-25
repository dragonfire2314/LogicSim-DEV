from flask import Flask, render_template

app = Flask(__name__)

@app.route('/sim')
def sim():
    return render_template('app/index.html')

@app.route('/')
def home():
    return render_template('frontPage.html')

if __name__ == "__main__":
    app.run(debug=True)