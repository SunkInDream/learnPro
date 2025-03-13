import requests
import json

API_KEY = "E3PJ0l5FT0neuNhJ2GOQAqVr"
SECRET_KEY = "iQZPfzrqnSeeKptkpzvEmZNsmjWo4DIN"

def main(user_question="hello"):
    """
    调用百度文心大模型API
    :param user_question: 用户输入的问题
    :return: API的响应内容
    """
    url = "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie-4.0-8k-latest?access_token=" + get_access_token()
    
    payload = json.dumps({
        "messages": [
            {
                "role": "user",
                "content": user_question
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
