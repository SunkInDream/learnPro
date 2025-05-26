import requests
import json

API_KEY = "E3PJ0l5FT0neuNhJ2GOQAqVr"
SECRET_KEY = "iQZPfzrqnSeeKptkpzvEmZNsmjWo4DIN"

def main(user_question="hello", subject=None, difficulty=None):
    """
    调用百度文心大模型API
    :param user_question: 用户输入的问题
    :param subject: 科目名称
    :param difficulty: 难度系数(1-10)
    :return: API的响应内容
    """
    url = "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie-4.0-8k-latest?access_token=" + get_access_token()
    
    # 根据科目和难度构建提示词
    if subject:
        # 难度文字描述
        difficulty_level = "中等"
        if difficulty:
            try:
                diff_val = int(difficulty)
                if diff_val <= 3:
                    difficulty_level = "简单"
                elif diff_val >= 8:
                    difficulty_level = "困难"
                else:
                    difficulty_level = "中等"
            except ValueError:
                pass
        
        prompt = f"""请你扮演一位{subject}老师，根据你的专业知识，生成10道{subject}科目的习题。
要求：
1. 难度系数为{difficulty}/10（满分10分，{difficulty_level}级别）
2. 每道题必须以数字序号开头，例如：1. 题目内容
3. 题目要符合{subject}学科特点和{difficulty_level}级别的难度
4. 题目之间必须有明显区分，不要重复
5. 确保题目清晰明了，适合学生练习"""
    else:
        prompt = user_question
    
    payload = json.dumps({
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "penalty_score": 1,
        "enable_system_memory": False,
        "disable_search": False,
        "enable_citation": False,
        "enable_trace": False
    }, ensure_ascii=False)
    headers = {
        'Content-Type': 'application/json'
    }
    
    response = requests.request("POST", url, headers=headers, data=payload.encode("utf-8"))
    
    return response.json()

def get_access_token():
    """
    使用 AK，SK 生成鉴权签名（Access Token）
    :return: access_token，或是None(如果错误)
    """
    url = "https://aip.baidubce.com/oauth/2.0/token"
    params = {"grant_type": "client_credentials", "client_id": API_KEY, "client_secret": SECRET_KEY}
    return str(requests.post(url, params=params).json().get("access_token"))

if __name__ == '__main__':
    main()
