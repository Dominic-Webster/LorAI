import json
import os
from difflib import get_close_matches

#load knowledge base from json file
def load_knowledge_base(file_path: str) -> dict:
    try:
        with open(file_path, 'r') as file:
            contents = file.read().strip()
            if not contents:
                return {"questions": []}
            data: dict = json.loads(contents)
    except (FileNotFoundError, json.JSONDecodeError):
        return {"questions": []}

    if "questions" not in data or not isinstance(data["questions"], list):
        data["questions"] = []
    return data

#save knowledge to json file
def save_knowledge_base(file_path: str, data: dict):
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=2)

#find best match from dictionary
def find_best_match(user_question: str, questions: list[str], cutval: float) -> str | None:
    matches: list = get_close_matches(user_question, questions, n=1, cutoff=cutval)
    return matches[0] if matches else None

#get answer for each question
def get_answer_for_question(question: str, knowledge_base: dict) -> str | None:
    for q in knowledge_base["questions"]:
        if q["question"] == question:
            return q["answer"]

#main script
def chat_bot():
    knowledge_base: dict = load_knowledge_base('info.json')

    if os.name == 'nt':  # Windows
        os.system('cls')
    else:  # macOS or Linux
        os.system('clear')
        
    valcut: float = 0.6
    trainmode : bool = False
    
    print('LorAI: Hi! I\'m LorAI, your friendly BSO chatbot!')
    valcut = 0.6
    
    while True:
        user_input: str = input('You: ')
        
        #end program
        if user_input.lower() in ['quit', 'bye', 'goodbye']:
            print('Goodbye!')
            break
        
        elif user_input.lower() == "enter training mode":
            print('TRAINING MODE ACTIVATED')
            valcut = 1.0
            trainmode = True
        
        elif user_input.lower() == "exit training mode":
            print('TRAINING MODE DEACTIVATED')
            valcut = 0.6
            trainmode = False
        
        else:
            best_match: str | None = find_best_match(user_input, [q["question"] for q in knowledge_base["questions"]], valcut)
        
            if best_match:
                answer: str = get_answer_for_question(best_match, knowledge_base)
                print(f'LorAI: {answer}')
            
            elif trainmode == True:
                print('LorAI: I don\'t know the answer. Can you teach me?')
                new_answer: str = input('Type the answer or "skip" to skip: ')
                
                if new_answer.lower() != 'skip':
                    knowledge_base["questions"].append({"question": user_input, "answer": new_answer})
                    save_knowledge_base('info.json', knowledge_base)
                    print('LorAI: Thanks! New response has been learned!')
            
            else:
                print('LorAI: I\'m afraid I don\'t know the answer, I\'m sorry.')

                
if __name__ == '__main__':
    chat_bot()