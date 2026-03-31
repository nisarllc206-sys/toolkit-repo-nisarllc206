
ai-pdf-super-generator
│
├── api
│   └── generator.js            # Node.js API route to trigger AI code generation
├── prompts
│   └── master_prompt.txt       # Master prompt for AI code generation
├── output
│   ├── android_project/        # Generated Android code
│   ├── backend/                 # Generated backend code
│   └── website/                 # Generated website code
├── package.json                 # Node.js dependencies
├── vercel.json                  # Vercel configuration for serverless function
├── README.md                    # Instructions & setup
└── .gitignore                   # node_modules, output/