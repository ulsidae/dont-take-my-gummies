# 🍬 Don't Take My Gummies!

## AI-Assisted Game Development Project

**Don't Take My Gummies!** is an AI-assisted board game project developed for the NHN Game x AI Hackathon.

> 🇰🇷 This project was developed for a Korean hackathon.  
> A Korean version of this README is also available: [README (한국어판)](https://github.com/ulsidae/dont-take-my-gummies/blob/main/docs/readme.kr.md)

This project was not about simply adding AI features to a game.

Instead, it explored how AI can support the development process by helping transform ideas into a playable product under limited time and resources.

The game is available through [GitHub Pages](https://ulsidae.github.io/dont-take-my-gummies/index.html).

---

# Table of Contents

| Section | Description |
| --- | --- |
| [🎮 Overview](#0) | Game introduction |
| [💡 Motivation](#1) | Project background |
| [🚀 Team & Role](#2) | Team structure and responsibilities |
| [🤖 AI Collaboration Process](#3) | How AI was utilized |
| [🏗️ Technical Implementation](#4) | Technical implementation |
| [🌍 Localization](#5) | Multi-language support |
| [🧪 Engineering Decisions](#6) | Technical decisions |
| [📈 Result](#7) | Development results |
| [🚀 What I Learned](#8) | Key takeaways |

---

<h2 id="0">🎮 Overview</h2>

**Don't Take My Gummies!** is a casual strategy board game inspired by classic territory expansion games.

Players take the role of a "Jelly Human" who collects gummies to repay their debt.

Gummies are the player's core resource, and the player loses when all gummies are depleted.

Players make strategic decisions through:

- Collecting gummies
- Expanding territories
- Responding to random events
- Managing resources

The goal of this project was not only to create a game.

It was to explore how AI can support the development process by making it easier to turn ideas into playable results through faster iteration and validation.

---

<h2 id="1">💡 Motivation</h2>

I have always enjoyed creating and playing board games, starting from simple prototypes with friends.

Recently, I wanted to transform that experience into a real software project by creating a board game prototype with my teammates.

<img src="https://github.com/ulsidae/dont-take-my-gummies/blob/main/docs/img/1.jpg" height="400" /><img src="https://github.com/ulsidae/dont-take-my-gummies/blob/main/docs/img/2.jpg" height="400" />

However, software development requires more than having a good idea.

Developers need to decide:

- What should be built
- Which features should be prioritized
- How the results should be validated

Through previous projects, I gained experience analyzing problems and understanding technical limitations.

However, I also identified several weaknesses:

- Limited implementation after identifying problems
- Documentation focused more on explanations than evidence
- Lack of validation for technical decisions
- Insufficient consideration of user experience

This project was an opportunity to improve these areas through actual development.

The main focuses were:

- Rapid prototyping
- Clear role distribution
- User-centered design
- Evidence-based validation

The NHN Game x AI Hackathon provided an environment where these goals could be tested under real constraints.

---

<h2 id="2">🚀 Team & Role</h2>

This project focused on developing a functional prototype through clear role distribution and fast decision-making within a limited development period.

# Regidit Team

## ulsidae

**Project Lead / Developer**

Responsibilities:

- Project schedule and goal management
- Feature prioritization
- Requirement organization and task planning
- GitHub Pages deployment environment setup
- Technical decision-making
- Team coordination

## hhandc

**Game System Developer**

Responsibilities:

- Game board system development
- Core game structure design
- Gameplay idea suggestions
- Game architecture review

## irupark500-cmd

**UI/UX Designer**

Responsibilities:

- UI design
- User interaction design
- User experience improvements

The goal was not simply to divide tasks, but to create a development process where planning, implementation, and validation were naturally connected.

---

<h2 id="3">🤖 AI Collaboration Process</h2>

The development period was limited, and completing every task manually was inefficient.

AI was used as a collaborative tool throughout the development process to reduce repetitive tasks and accelerate iteration.

## 🎨 Design

Used for:

- User experience-oriented image generation
- Logo and game asset creation

Tools:

- Gemini
- Photoshop AI features

---

## 💻 Development

Used for:

- Code writing assistance
- Refactoring suggestions
- Debugging support

Tool:

- ChatGPT Codex

---

## 🧪 Quality Assurance

Used for:

- Generating test scenarios
- Exploring edge cases
- Reviewing game logic

---

## 🌍 Localization

Used for:

- Translating game content
- Reviewing natural expressions

---

A key principle of AI usage was not directly accepting generated results.

All outputs were reviewed and refined through the team's validation process to maintain quality.

Additionally, a prompting document was created to organize project requirements and improve consistency during AI-assisted development.

---

<h2 id="4">🏗️ Technical Implementation</h2>

## Frontend

- JavaScript
- HTML/CSS
- Progressive Web App

## Game System

- Modular game state management
- Turn-based game loop
- Event-driven game actions

## Game Architecture

- Modular event handling system
- Separation between language resources and game logic

## Testing

- Automated game logic testing

---

## Deployment Validation

A project that works locally does not always behave the same way after deployment.

During the initial deployment process, issues related to French localization and resource handling occurred.

The improvement process included:

1. Reproducing deployment issues
2. Identifying root causes
3. Improving localization structure
4. Re-validating the system

Initially, I assumed that successful local testing was sufficient.

However, unexpected issues after deployment showed the importance of validating software in real service environments.

Related article:

[Deployment Issue & Improvement](https://github.com/ulsidae/dont-take-my-gummies/blob/main/docs/verification-report.md)

---

<h2 id="5">🌍 Localization</h2>

The game supports:

- Korean
- English
- French

The localization system was designed by separating game logic from language resources.

This structure improves maintainability and makes adding new languages easier.

---

<h2 id="6">🧪 Engineering Decisions</h2>

## Why JavaScript?

The project required fast implementation and validation within a limited development period.

Instead of using a framework, JavaScript was chosen to:

- Reduce setup complexity
- Focus on game logic
- Enable rapid prototyping

---

## Why prioritize MVP?

Initially, many additional features and expansion ideas were considered.

The following roadmap shows some of the features considered during the early planning phase.

<img src="https://github.com/ulsidae/dont-take-my-gummies/blob/main/docs/roadmap.png" height="400" />

However, during development, I realized that completing the core experience was more important than increasing the number of features.

Therefore:

> Delivering one complete experience was prioritized over many unfinished features.

To achieve this:

<img src="https://github.com/ulsidae/dont-take-my-gummies/blob/main/docs/img/3.png" height="400" />

- Development workflow

<img src="https://github.com/ulsidae/dont-take-my-gummies/blob/main/docs/img/4.jpg" height="400" />

- Design workflow

were separated to manage tasks efficiently and complete the project within the given timeframe.

---

<h2 id="7">📈 Result</h2>

Key outcomes:

✅ Playable board game prototype  
✅ AI-assisted development workflow  
✅ Multi-language support  
✅ Automated testing environment  
✅ Web deployment  

## Testing

```
44 tests passed
0 failed
```

Additional results:

- Supports 3 languages
- Passed 44 automated tests
- Deployed through GitHub Pages

---

<h2 id="8">🚀 What I Learned</h2>

Through this project, I learned that the greatest advantage of AI is not replacing developers by writing code, but reducing the iteration cost between ideas, implementation, and validation.

AI is not a replacement for engineering decisions.

It is a collaboration tool that reduces repetitive tasks and supports better decision-making.

I also learned that product development requires more than technical implementation.

It requires:

- Prioritization
- Schedule management
- Team coordination
- User experience consideration

**Don't Take My Gummies!** represents my experience of transforming an idea into a playable product through engineering decisions, teamwork, and AI-assisted development.
