from flask import Flask,request, jsonify
from flask_cors import CORS
from app.models.database import db, User, app
from flask_sqlalchemy import SQLAlchemy
from app.models.LLM import main as llm_query
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
    
@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    question = data.get('question')
    
    if not question:
        return {'error': '请输入问题'}, 400
    
    try:
        # 打印调试信息
        print(f"收到问题: {question}")
        
        # 调用LLM模型获取回答
        response = llm_query(question)
        
        # 调试输出
        print(f"API返回: {response}")
        
        # 检查各种可能的响应格式
        if isinstance(response, dict):
            if 'result' in response:
                ai_answer = response['result']
            elif 'response' in response:
                ai_answer = response['response']
            elif 'content' in response:
                ai_answer = response['content']
            elif 'message' in response and isinstance(response['message'], dict) and 'content' in response['message']:
                ai_answer = response['message']['content']
            else:
                # 如果找不到预期字段，尝试寻找其他可能的响应字段
                print(f"无法找到标准响应字段，响应键: {response.keys()}")
                ai_answer = str(response)
        else:
            ai_answer = '抱歉，服务器返回了意外格式的数据'
            print(f"意外的响应类型: {type(response)}")
        
        return {'answer': ai_answer}, 200
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"聊天API错误: {str(e)}\n{error_details}")
        return {'error': f'处理请求时出错: {str(e)}'}, 500