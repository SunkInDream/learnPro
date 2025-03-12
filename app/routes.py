from flask import Flask,request, jsonify
from flask_cors import CORS
from app.models.database import db, User, app
from flask_sqlalchemy import SQLAlchemy
CORS(app)



@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    credentials_valid = User.check_user_credentials(username, password)
    if not credentials_valid:
        return {'error': 'Invalid credentials'}, 401
    else:
        return {'success': True}, 200
    
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    phone = data.get('phone')
    # 判断用户是否已存在
    if User.query.filter_by(username=username).first():
        return {'error': 'User already exists'}, 400
    else:
        User.add_user(username, password, email, phone)
        return {'success': True}, 200

@app.route('/api/user/info', methods=['GET'])
def display_user_info():
    username = request.args.get('username')
    user = User.query.filter_by(username=username).first()
    if user is None:
        return {'error': 'User not found'}, 404
    else:
        return {
            'username': user.username, 
            'email': user.email, 
            'phone': user.phone, 
            'nickname': user.nickname,
            'grade': user.grade,
            'birthday': user.birthday,
            'targetSchool': user.targetSchool,
            'bio': user.bio
        }, 200  

@app.route('/api/user/update', methods=['POST'])
def update_user_info():
    data = request.get_json()
    username = data.get('username')
    user = User.query.filter_by(username=username).first()
    if user is None:
        return {'error': 'User not found'}, 404
    else:
        user.nickname = data.get('nickname')
        user.grade = data.get('grade')
        user.birthday = data.get('birthday')
        user.targetSchool = data.get('targetSchool')
        user.bio = data.get('bio')
        db.session.commit()
        return {'success': True}, 200