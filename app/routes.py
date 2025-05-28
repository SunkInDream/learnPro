from flask_cors import CORS
from app.models.database import db, User, app, LoginList, EatPlace, RestWay
from datetime import datetime, date, timedelta
from flask_sqlalchemy import SQLAlchemy
from app.models.LLM import main as llm_query
from flask import Flask, jsonify, request, send_file, make_response, send_from_directory
from docx import Document
from werkzeug.utils import secure_filename
import os
from urllib.parse import quote

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
        return {'success': True}, 200 #200是HTTP状态码，表示请求成功
    
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
        study_days = LoginList.query.filter_by(user_id=user.id).distinct(db.func.date(LoginList.login_time)).count()
        return {
            'username': user.username, 
            'email': user.email, 
            'phone': user.phone, 
            'nickname': user.nickname,
            'grade': user.grade,
            'birthday': user.birthday,
            'targetSchool': user.targetSchool,
            'bio': user.bio,
            'avatar': user.avatar,
            'studyDays': study_days,
            'focusTime': user.focusTime,
            'lastLoginTime': user.lastLoginTime
        }, 200  



@app.route('/api/punch', methods=['POST'])
def punch():
    data = request.get_json()
    username = data.get('username')
    user = User.query.filter_by(username=username).first()
    if not user:
        return {'error': 'User not found'}, 404

    today = date.today()
    existing = LoginList.query.filter_by(user_id=user.id, login_date=today).first()
    if not existing:
        login_record = LoginList(
            user_id=user.id,
            login_time=datetime.now(),
            login_date=today,
            ip_address=request.remote_addr or 'unknown'
        )
        db.session.add(login_record)
        db.session.commit()
    return {'success': True}, 200


@app.route('/api/addeatplace', methods=['POST'])
def add_eat_place():
    data = request.get_json()
    username = data.get('username')
    place_name = data.get('place_name')
    user = User.query.filter_by(username=username).first()
    if not user:
        return {'error': 'User not found'}, 404

    eat_place = EatPlace(user_id=user.id, place_name=place_name)
    db.session.add(eat_place)
    db.session.commit()

    return {'success': True}, 200

@app.route('/api/addrestway', methods=['POST'])
def add_rest_way():
    data = request.get_json()
    username = data.get('username')
    rest_type = data.get('rest_type')
    user = User.query.filter_by(username=username).first()
    if not user:
        return {'error': 'User not found'}, 404

    rest_way = RestWay(user_id=user.id, rest_type=rest_type)
    db.session.add(rest_way)
    db.session.commit()

    return {'success': True}, 200


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

        # user.avatar = data.get('avatar')
        # user.focusTime = data.get('focusTime')
        # user.lastLoginTime = data.get('lastLoginTime')

        db.session.commit()
        return {'success': True}, 200
    
@app.route('/api/uploadimg', methods=['POST'])
def upload_image():
    username = request.form.get('username')
    file = request.files.get('avatar')

    if not username or not file:
        return {'error': '用户名或文件为空'}, 400

    db_dir = os.path.dirname(os.path.abspath(__file__)) 
    models_dir = os.path.join(db_dir, 'models')          
    if not os.path.exists(models_dir):
        models_dir = os.path.dirname(db_dir)             

    static_dir = os.path.join(models_dir, 'static')
    upload_folder = os.path.join(static_dir, 'uploads')
    os.makedirs(upload_folder, exist_ok=True)

    filename = secure_filename(file.filename)
    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)

    image_url = f"http://localhost:5000/static/uploads/{filename}"


    user = User.query.filter_by(username=username).first()
    if not user:
        return {'error': '用户不存在'}, 404

    user.avatar = image_url
    db.session.commit()

    return {'success': True, 'imageUrl': image_url}, 200



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

@app.route('/api/generate_exam', methods=['GET'])
def generate_exam():
    subject = request.args.get('subject', '通用')
    difficulty = request.args.get('difficulty', '5')
    
    try:
        llm_response = llm_query(user_question="", subject=subject, difficulty=difficulty)
        if isinstance(llm_response, dict) and 'result' in llm_response:
            response_text = llm_response['result']
            questions = [line.strip() for line in response_text.split('\n')
                         if any(line.strip().startswith(f"{i}.") for i in range(1, 11))]
            if not questions:
                questions = [
                    f"1. {subject}(难度{difficulty}/10)：求下列函数的导数：f(x) = 2x^3 - 5x + 3",
                    f"2. {subject}(难度{difficulty}/10)：求下列函数在x=1处的导数：f(x) = sin(x)",
                    f"3. {subject}(难度{difficulty}/10)：求下列函数的导数并求出其极值：f(x) = x^4 - 4x^3 + 6x^2 - 3x + 2"
                ]
        else:
            questions = [
                f"1. {subject}(难度{difficulty}/10)：求下列函数的导数：f(x) = 2x^3 - 5x + 3",
                f"2. {subject}(难度{difficulty}/10)：求下列函数在x=1处的导数：f(x) = sin(x)",
                f"3. {subject}(难度{difficulty}/10)：求下列函数的导数并求出其极值：f(x) = x^4 - 4x^3 + 6x^2 - 3x + 2"
            ]
    except Exception as e:
        print(f"生成题目错误: {e}")
        questions = [
            f"1. {subject}(难度{difficulty}/10)：求下列函数的导数：f(x) = 2x^3 - 5x + 3",
            f"2. {subject}(难度{difficulty}/10)：求下列函数在x=1处的导数：f(x) = sin(x)",
            f"3. {subject}(难度{difficulty}/10)：求下列函数的导数并求出其极值：f(x) = x^4 - 4x^3 + 6x^2 - 3x + 2"
        ]

    # --- 改为生成 Markdown 并返回 ---
    markdown_lines = [f"# {subject} 试卷 (难度{difficulty}/10)", ""]
    for q in questions:
        markdown_lines.append(q)
    markdown_content = "\n\n".join(markdown_lines)

    response = make_response(markdown_content)
    filename = f"{subject}_试卷_难度{difficulty}.md"
    # 使用 RFC5987 编码中文文件名，避免 Latin-1 编码错误
    response.headers["Content-Disposition"] = f"attachment; filename*=UTF-8''{quote(filename)}"
    response.headers["Content-Type"] = "text/markdown; charset=utf-8"
    return response
