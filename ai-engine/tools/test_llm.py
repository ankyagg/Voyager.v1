from config import get_llm

llm = get_llm()

response = llm.invoke("Why is Goa popular for tourism?")

print(response.content)