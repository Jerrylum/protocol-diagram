## Coding Guidelines

### 2 Spaces for Indentation Rather Than Tabs
Remember to change your settings in your editor to use 2 spaces when you create a new file.

### Add UX and ALGO Comments
Add comments to your code to explain the code related to user experience and algorithms.

### Format Your Code
Self explanatory. Use [Prettier](https://prettier.io/). If you are using VSCode, press `Shift + Alt + F` to format your code.

### Follow Naming Conventions
Self explanatory. Follow the conventions of the language you are using. For example, in TypeScript, use camelCase for variables and functions, and PascalCase for classes.


## Workflow

### Bug Reports
Use the issue templates to create a bug report. If a fix is needed, create a Jira bug issue later and link it to the GitHub issue.

### Commit Messages
If the commit is related to a specific issue in the Jira board, you must include the issue number in the commit message, even if it is in the branch with the issue number in the name. 

After that, it is followed by a verb in the imperative mood, and the rest of the message should be in the present tense. The first letter of the message should be capitalized. No period at the end of the message.

For example:

If the issue number is `PD-123`, the commit message should be `PD-123 Add new feature`.

If the commit is unrelated to an issue in the Jira board (should be rare), the commit message should be `Add new feature`.

### Branch Naming
If the branch is related to a specific issue in the Jira board, you must include the issue number in the branch name.

After that, it is followed by the title (summary) of the Jira issue in kebab-case.

For example:

If the issue number is `PD-123`, the branch name should be `PD-123-add-new-feature`.

If the title is more than four words or hard to read, just `PD-123` is acceptable.

If the branch is unrelated to a specific issue in the Jira board, the branch name should be just the title. For example, `add-new-feature`.

### Never Push Directly to Main, Always Create a Branch With Pull Request
Do not push directly to main. You should create a branch with a pull request. Then, you can continue to work on your branch and push your commits to the branch.

### Don't be Afraid to Push Your Code
Do not keep a ton of commits locally, squash them into one commit and push it when you are done. You should push your commits to the branch often, so that you can get feedback on your code as soon as possible. 
