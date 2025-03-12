from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///instance.sqlite"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)  # Add this line
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(120), unique=True, nullable=False)
    nickname = db.Column(db.String(120))
    grade = db.Column(db.String(120))
    birthday = db.Column(db.String(120))
    targetSchool = db.Column(db.String(120))
    bio = db.Column(db.String(1200))
    def __init__(self, username, password, email, phone, nickname=None,grade=None,birthday=None,targetSchool=None,bio=None):
        self.username = username
        self.password = password
        self.email = email
        self.phone = phone
        self.nickname = nickname
        self.grade = grade
        self.birthday = birthday
        self.targetSchool = targetSchool
        self.bio = bio
    @classmethod
    def add_user(cls, username, password, email, phone,nickname=None,grade=None,birth=None,target_Uni=None,self_Intro=None):
        user = cls(username, password, email, phone, nickname,grade,birth,target_Uni,self_Intro)
        db.session.add(user)
        db.session.commit()
    
    def check_user_credentials(username, password):
        user = User.query.filter_by(username=username).first()
        if user is None:
            return False
        return user.password == password

with app.app_context():
    db.create_all()


