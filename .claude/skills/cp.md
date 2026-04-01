---
name: cp
description: Commit all changes and push to remote
user_invocable: true
---

Commit and push all current changes. Follow these steps:

1. Run `git add -A` to stage all changes
2. Run `git diff --cached --stat` and `git diff --cached` to see what will be committed
3. Based on the diff, generate a concise commit message in Korean that describes the changes (1-2 sentences, focusing on "why" not "what")
4. Commit with the generated message using a HEREDOC format. Do NOT include Co-Authored-By trailer.
5. Run `git push` to push to remote
6. Report the result to the user with the commit hash and push status
