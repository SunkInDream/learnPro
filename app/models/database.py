from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///../instance/instance.sqlite"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(120), unique=True, nullable=False)
    nickname = db.Column(db.String(120))
    grade = db.Column(db.String(120))
    birthday = db.Column(db.String(120))
    targetSchool = db.Column(db.String(120))
    bio = db.Column(db.String(1200))
    avatar = db.Column(db.String(120))
    studyDays = db.Column(db.Integer, default=0)
    focusTime = db.Column(db.Integer, default=0)
    lastLoginTime = db.Column(db.DateTime, default=datetime.utcnow)
    login_list = db.relationship('LoginList', backref='user', lazy=True)
    restway = db.relationship('RestWay', backref='user', lazy=True)
    eatplace = db.relationship('EatPlace', backref='user', lazy=True)
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

class RestWay(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    rest_type = db.Column(db.String(50), nullable=False)


class EatPlace(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    place_name = db.Column(db.String(100), nullable=False)
    
class LoginList(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    login_time = db.Column(db.DateTime)
    login_date = db.Column(db.Date)  # 新增字段
    ip_address = db.Column(db.String(64))
    __table_args__ = (
        db.UniqueConstraint('user_id', 'login_date', name='unique_user_date'),
    )

class Subject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    chapter = db.relationship('Chapter', backref='subject', lazy=True)

class Chapter(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subject.id'), nullable=False)
    topic = db.relationship('Topic', backref='chapter', lazy=True)

class Topic(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    chapter_id = db.Column(db.Integer, db.ForeignKey('chapter.id'), nullable=False)
    

# math = Subject(name='数学')
# english = Subject(name='英语')
# biology = Subject(name='生物')
# chinese = Subject(name='语文')
# physics = Subject(name='物理')
# chemistry = Subject(name='化学')
# db.session.add_all([math, english, biology, chinese, physics, chemistry])
# db.session.commit()



with app.app_context():
    print("当前数据库文件路径：", db.engine.url.database)
    db.create_all()
