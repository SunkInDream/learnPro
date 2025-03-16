from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
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
    knowledge_progresses = db.relationship('UserKnowledgeProgress', backref='user', lazy=True)
    exercise_records = db.relationship('ExerciseRecord', backref='user', lazy=True)
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
    
    from datetime import datetime

class KnowledgePoint(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    subject = db.Column(db.String(100), nullable=False)  

class ExerciseRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    knowledge_point_id = db.Column(db.Integer, db.ForeignKey('knowledge_point.id'), nullable=False)
    difficulty = db.Column(db.Integer) 
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class UserKnowledgeProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    knowledge_point_id = db.Column(db.Integer, db.ForeignKey('knowledge_point.id'), nullable=False)
    mastery_level = db.Column(db.Float, default=0.0)  # 掌握程度 0-100
    last_practiced = db.Column(db.DateTime)
    
    # 确保用户和知识点组合的唯一性
    __table_args__ = (db.UniqueConstraint('user_id', 'knowledge_point_id'),)

with app.app_context():
    db.create_all()


