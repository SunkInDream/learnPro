# pip install openai
from openai import OpenAI
import json

# ========= 配置 =========
client = OpenAI(
    api_key="your-openai-api-key-here",  # 替换为您的 OpenAI API 密钥
    # base_url="https://api-1fwdm4d312ich0n1.aistudio-app.com/v1"  # 注释掉自定义端点
)
MODEL_NAME = "gpt-3.5-turbo"   # 使用 OpenAI 标准模型

# ========= 工具函数 =========
def clean_question_text(text: str) -> str:
    text = text.replace("$", "")
    text = text.replace("\\times", "×").replace("\\div", "÷").replace("\\pm", "±").replace("\\cdot", "·")
    return text

def _chat_once(messages, temperature=0.3):
    """统一的对话调用，返回纯文本 content 字符串。"""
    resp = client.chat.completions.create(
        model=MODEL_NAME,
        temperature=temperature,
        messages=messages
    )
    # OpenAI 兼容返回：choices[0].message.content
    return resp.choices[0].message.content if resp and resp.choices else ""

# ========= 业务函数 =========
def generatequestion(user_question="hello", subject=None, grade=None, knowledge=None, difficulty=None):
    # 与原逻辑一致：根据 difficulty 映射等级文字
    difficulty_level = "中等"
    if difficulty is not None:
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
7. 从网站 https://www.zxxk.com/ 获取相关知识点的习题（只借鉴风格与难度，不要直接复制）
8. 相同的提示词，请不要生成相同的题目
9. 难度一定要符合，不要给高中生出小学题目
"""

    content = _chat_once(
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    questions_clean = clean_question_text(content or "")

    # 尽量保持与原代码类似的返回结构：包含 "result"
    return {
        "result": questions_clean,
        "raw_response": content  # 备查：原始（未清洗）文本
    }

def generatetimetable(starttime, endtime, subjects, restMethods=None, knowledgeMastery=None, studyHistory=None):
    prompt = f"""
请为我生成从{starttime}到{endtime}的学习计划，科目包括：{', '.join(subjects)}, 休息方式包括：{', '.join(restMethods) if restMethods else '无特别要求'}
我的知识掌握情况是：{json.dumps(knowledgeMastery, ensure_ascii=False) if knowledgeMastery else '无特别说明'}
我的学习历史是：{json.dumps(studyHistory, ensure_ascii=False) if studyHistory else '无特别说明'}
请只输出一个JSON数组或对象，字段仅包含：key, timeslot, content, difficulty, exercises, type。
注意：
- difficulty 为整数，且必须在 1 到 10 之间。
- exercises 应为对象，至少包含 score 字段（数值或整数百分比）。
- 严格输出 JSON（不要额外文字说明）。
"""

    content = _chat_once(
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2
    )

    # 尝试将返回解析为 JSON；解析失败则原样放回
    parsed = None
    if content:
        try:
            parsed = json.loads(content)
        except Exception:
            parsed = None

    return {
        "result": parsed if parsed is not None else content,
        "raw_response": content
    }

def chat(message):
    """改进的聊天函数，添加更严格的控制"""
    try:
        # 添加系统提示，明确要求简洁回答
        messages = [
            {
                "role": "system", 
                "content": "你是一个智能助手，请简洁明了地回答用户问题。每次只回答当前问题，不要包含无关内容或示例对话。"
            },
            {
                "role": "user", 
                "content": message
            }
        ]
        
        # 调用API时添加更严格的参数控制
        resp = client.chat.completions.create(
            model=MODEL_NAME,
            temperature=0.3,
            messages=messages,
            max_tokens=500,  # 限制最大输出长度
            stop=["\n\nUser:", "\nUser:", "User:"],  # 添加停止词，防止生成对话示例
            frequency_penalty=0.5,  # 减少重复内容
            presence_penalty=0.3   # 鼓励多样性
        )
        
        if resp and resp.choices and len(resp.choices) > 0:
            content = resp.choices[0].message.content
            # 清理可能的多余内容
            if content:
                # 如果包含"User:"等对话标识，截断到第一个出现的位置
                stop_markers = ["\n\nUser:", "\nUser:", "User:", "\n\n```", "当然 可以！"]
                for marker in stop_markers:
                    if marker in content:
                        content = content.split(marker)[0].strip()
                        break
                        
                # 进一步清理
                content = content.strip()
                if len(content) > 1000:  # 如果回答过长，截断
                    content = content[:1000] + "..."
                    
            return {"result": content or "抱歉，我无法理解您的问题。"}
        else:
            return {"result": "抱歉，AI服务暂时不可用。"}
            
    except Exception as e:
        print(f"Chat API调用错误: {e}")
        return {"result": f"抱歉，处理您的问题时出现错误：{str(e)}"}

# ========= 兼容原入口 =========
def main(user_question="hello", subject=None, grade=None, knowledge=None, difficulty=None):
    return generatequestion(user_question, subject, grade, knowledge, difficulty)

# 原来的 get_access_token 不再需要；为了兼容引用，若别处调用也不会报错
def get_access_token():
    return None

if __name__ == '__main__':
    # 简单自测
    print(main(subject="数学", grade="高一", knowledge="二次函数", difficulty=6)["result"])
