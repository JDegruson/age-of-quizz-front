# Age of Quizz Front

This project is a React application for creating and managing quiz questions related to Age of Empires 2. It provides a user-friendly interface for users to create questions and view them.

## Project Structure

```
age-of-quizz-front
├── src
│   ├── index.tsx          # Entry point of the application
│   ├── App.tsx            # Main application component with routing
│   ├── pages
│   │   ├── CreateQuestion.tsx  # Page for creating quiz questions
│   │   └── Home.tsx       # Landing page of the application
│   ├── components
│   │   ├── QuestionForm.tsx    # Component for the question creation form
│   │   └── QuestionList.tsx     # Component for displaying created questions
│   ├── services
│   │   └── api.ts          # API service for fetching and submitting questions
│   ├── hooks
│   │   └── useForm.ts      # Custom hook for form management
│   ├── styles
│   │   └── index.css       # Global CSS styles
│   └── types
│       └── index.ts        # TypeScript interfaces and types
├── public
│   └── index.html          # Main HTML file
├── package.json             # npm configuration file
├── tsconfig.json            # TypeScript configuration file
├── vite.config.ts           # Vite configuration file
└── README.md                # Project documentation
```

## Getting Started

To get started with the project, follow these steps:

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd age-of-quizz-front
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Run the application:**
   ```
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000` to view the application.

## Features

- Create quiz questions related to Age of Empires 2.
- View a list of created questions.
- Responsive design for a better user experience.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License.