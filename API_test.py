import os
from anthropic import Anthropic

# 1. Initialize the client
# It will automatically look for an environment variable named 'ANTHROPIC_API_KEY'
# Or you can pass it manually: client = Anthropic(api_key="your-key-here")
client = Anthropic(api_key="insert API key here ")


prompt = input("Enter something you would like to find out: ")
try:
    # 2. Create a message
    message = client.messages.create(
        model="claude-opus-4-6",   # change this to "claude-sonnet-4-6" or "claude-haiku-4-5-20251001" for different models (these will be cheaper)
        max_tokens=1024,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    # 3. Print the response
    print("\n--- Claude's Response ---")
    print(message.content[0].text)
    print("-------------------------\n")
    print("Success! Your API key is working.")

except Exception as e:

    print(f"Error: {e}")
