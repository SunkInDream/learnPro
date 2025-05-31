import requests
import json

API_KEY = "E3PJ0l5FT0neuNhJ2GOQAqVr"
SECRET_KEY = "iQZPfzrqnSeeKptkpzvEmZNsmjWo4DIN"

def clean_question_text(text):
    text = text.replace("$", "")
    text = text.replace("\\times", "×").replace("\\div", "÷").replace("\\pm", "±").replace("\\cdot", "·")
    return text

def main(user_question="hello", subject=None, grade=None, knowledge=None, difficulty=None):
    url = "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie-4.0-8k-latest?access_token=" + get_access_token()

    difficulty_level = "中等"
    if difficulty:
        try:
            diff_val = int(difficulty)
            if diff_val <= 3:
                difficulty_level = "简单"
            elif diff_val >= 8:
                difficulty_level = "困难"
        except ValueError:
            pass

    prompt = f"""请你扮演一位{subject}老师，根据你的专业知识，面向{grade}年级学生，针对知识点“{knowledge}”，生成10道{subject}科目的习题。
要求：
1. 难度系数为{difficulty}/10（满分10分，{difficulty_level}级别）
2. 每道题必须以数字序号开头，例如：1. 题目内容
3. 题目要符合{subject}学科特点和{difficulty_level}级别的难度
4. 题目之间必须有明显区分，不要重复
5. 题目用纯文本，符号如加减乘除用常规符号，不要出现 $ 符号
6. 确保题目清晰明了，适合学生练习
7.从网站 https://www.zxxk.com/ 获取相关知识点的习题
8.相同的提示词，请不要生成相同的题目
9.难度一定要符合，不要给高中生出小学题目"""

    payload = json.dumps({
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "penalty_score": 1,
        "enable_system_memory": False,
        "disable_search": False,
        "enable_citation": False,
        "enable_trace": False
    }, ensure_ascii=False)

    headers = {'Content-Type': 'application/json'}
    response = requests.post(url, headers=headers, data=payload.encode("utf-8"))

    res_json = response.json()
    questions_raw = res_json.get("result", "")
    questions_clean = clean_question_text(questions_raw)
    res_json["result"] = questions_clean

    return res_json

def get_access_token():
    url = "https://aip.baidubce.com/oauth/2.0/token"
    params = {"grant_type": "client_credentials", "client_id": API_KEY, "client_secret": SECRET_KEY}
    return str(requests.post(url, params=params).json().get("access_token"))

if __name__ == '__main__':
    main()
