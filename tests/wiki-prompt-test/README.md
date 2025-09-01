# Wiki Generation Prompt Test Environment

This test environment allows you to test the wiki generation prompt without running the full DeepWiki system.

## Features

- 🚀 Standalone prompt testing
- 📝 Sample test data included
- ✅ Output validation
- 🤖 Support for OpenAI/Anthropic API testing
- 📊 Validation checks for all requirements

## Setup

1. Install dependencies:
```bash
cd tests/wiki-prompt-test
npm install
```

2. API Keys:
The test uses the same API keys as the main project.
Make sure your root `.env` file contains:
```
GOOGLE_API_KEY=your-google-api-key
OPENAI_API_KEY=your-openai-api-key
```

## Usage

### 1. Local Testing (No API)

When no API keys are configured, generates prompt only:
```bash
npm run test
```

This will:
- Generate the full prompt with test data
- Save it to `output/generated-prompt.md`
- You can manually test this prompt with any LLM
- Shows message: "💾 Local test mode - prompt saved for manual testing"

### 2. API Testing

**Default: Google Gemini** (gemini-2.5-flash)
```bash
npm run test
```
When `GOOGLE_API_KEY` is set in root .env:
- Automatically uses Google Gemini API
- Generates wiki in Korean by default
- Saves result to `output/generated-wiki.md`

**Alternative: OpenAI** (gpt-5-nano)
```bash
npm run test -- --openai
```
When `OPENAI_API_KEY` is set in root .env:
- Uses OpenAI API instead of Google
- Generates wiki in Korean by default
- Saves result to `output/generated-wiki.md`
- Generates wiki in Korean by default

Both will save the response to `output/generated-wiki.md`

### 3. Validate Output

Check if generated wiki follows all requirements:
```bash
npm run validate
# or validate a specific file:
npm run validate output/generated-wiki.md
```

Validation checks:
- ✅ Starts with `<details>` block
- ✅ Has at least 5 source files cited
- ✅ Has H1 title after details
- ✅ Uses Mermaid @{} syntax
- ✅ Has proper source citations with line numbers
- ✅ Uses vertical diagrams (TD not LR)

## Test Data

The test includes sample authentication system files:
- `src/auth/login.ts` - Authentication service
- `src/models/User.ts` - User model
- `src/utils/crypto.ts` - Password hashing
- `src/utils/jwt.ts` - JWT token handling
- `src/middleware/auth.ts` - Auth middleware

## Customization

Edit `test-runner.ts` to:
- Change the test topic
- Add more test files
- Modify the language
- Test different scenarios

## Output Files

- `output/generated-prompt.md` - The full prompt sent to AI
- `output/generated-wiki.md` - The AI's response (if using API)
- Validation results shown in console

## Troubleshooting

1. **No API response**: Check your API key in `.env`
2. **Validation fails**: Review the error messages and adjust prompt
3. **Mermaid syntax issues**: Ensure @{} syntax is being used

## Benefits

- 🎯 Fast iteration on prompt improvements
- 🔍 Easy validation of requirements
- 💰 Cost-effective testing without full system
- 📈 Quick feedback on prompt quality
