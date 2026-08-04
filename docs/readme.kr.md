# 🍬 Don't Take My Gummies!

## AI 기반 게임 개발 실험 프로젝트

**Don't Take My Gummies!** 는 NHN Game x AI Hackathon 참가를 위해 제작한 AI 협업 기반 보드게임 프로젝트입니다.

이 프로젝트는 단순히 AI 기능을 추가한 게임을 만드는 것이 아니라,  
**AI를 활용해 제한된 시간과 자원 안에서 아이디어를 실제 플레이 가능한 결과물로 발전시키는 과정**을 실험하는 것을 목표로 진행했습니다.

현재 [GitHub Pages](https://ulsidae.github.io/dont-take-my-gummies/index.html)를 통해 직접 플레이할 수 있습니다.

---

# 목차

| Section | Description |
| --- | --- |
| [🎮 Overview](#0) | 게임 소개 |
| [💡 Motivation](#1) | 프로젝트 시작 배경 |
| [🚀 Team & Role](#2) | 팀 구성 및 역할 |
| [🤖 AI Collaboration Process](#3) | AI 활용 과정 |
| [🏗️ Technical Implementation](#4) | 기술 구현 |
| [🌍 Localization](#5) | 다국어 지원 |
| [🧪 Engineering Decisions](#6) | 기술적 의사결정 |
| [📈 Result](#7) | 개발 결과 |
| [🚀 What I Learned](#8) | 프로젝트를 통해 얻은 경험 |

---

<h2 id="0">🎮 Overview</h2>

**Don't Take My Gummies!** 는 클래식한 영토 확장 보드게임에서 영감을 받은 캐주얼 전략 게임입니다.

플레이어는 빚을 갚기 위해 젤리를 모으는 **"젤리인간"** 이 되어 게임을 진행합니다.

게임에서 젤리는 플레이어의 핵심 자산이며, 젤리가 모두 소진되면 패배합니다.

플레이어는:

- 젤리 수집
- 영토 확보
- 랜덤 이벤트 대응
- 자원 관리

를 통해 전략적인 선택을 내립니다.

이 프로젝트의 목표는 단순히 게임을 완성하는 것이 아니었습니다.

아이디어를 실제 결과물로 발전시키는 과정에서,
AI를 활용하여 기획, 구현, 수정 과정의 반복 속도를 높이고,
제한된 기간 안에서 실제 플레이 가능한 결과물을 완성하는 과정을 경험하고자 했습니다.

---

<h2 id="1">💡 Motivation</h2>

어릴 때 친구들과 직접 보드게임을 만들어 즐겼던 경험이 있습니다.

최근에도 이러한 관심을 바탕으로 팀원들과 직접 보드게임 프로토타입을 제작하며,
어릴 때의 경험을 실제 소프트웨어 프로젝트로 발전시키고자 했습니다.

<img src="https://github.com/ulsidae/dont-take-my-gummies/blob/main/docs/img/1.jpg" height="400" /><img src="https://github.com/ulsidae/dont-take-my-gummies/blob/main/docs/img/2.jpg" height="400" />

그때의 추억을 다시 게임이라는 형태로 만들어보고 싶다는 생각에서 프로젝트가 시작되었습니다.

하지만 실제 소프트웨어 개발에서는 좋은 아이디어만으로 결과물을 만들 수 없습니다.

개발자는 제한된 환경에서:

- 무엇을 만들 것인지
- 어떤 기능을 우선할 것인지
- 어떻게 결과를 검증할 것인지

결정해야 합니다.

기존 프로젝트를 진행하며 문제를 분석하고 기술적 한계를 파악하는 경험을 쌓았습니다.

하지만 동시에 다음과 같은 한계도 발견했습니다.

- 문제 분석 이후 실제 개선 구현 부족
- 설명 중심의 기술 문서화
- 의사결정 근거와 결과 검증 부족
- 사용자 관점 고려 부족

이번 프로젝트에서는 이러한 부분을 실제 개발 과정에서 개선하고자 했습니다.

특히:

- 빠른 프로토타이핑
- 명확한 역할 분배
- 사용자 경험 중심 설계
- 결과물 기반 검증

에 집중했습니다.

NHN Game x AI Hackathon은 이러한 목표를 제한된 시간 안에서 직접 검증할 수 있는 환경이었습니다.

---

<h2 id="2">🚀 Team & Role</h2>

이번 프로젝트에서는 제한된 개발 기간 안에서
명확한 역할 분배와 빠른 의사결정을 통해
아이디어를 실제 동작하는 프로토타입으로 발전시키는 과정을 목표로 했습니다.

# Regidit Team

## ulsidae

**Project Lead / Developer**

담당:

- 프로젝트 일정 및 목표 관리
- 개발 우선순위 조정
- 요구사항 정리 및 작업 방향 결정
- GitHub Pages 기반 배포 환경 구축
- 기술적 의사결정
- 팀 작업 조율

## hhandc

**Game System Developer**

담당:

- 게임 보드 시스템 개발
- 핵심 게임 구조 설계
- 게임 아이디어 제안
- 게임 구조 검토

## irupark500-cmd

**UI/UX Designer**

담당:

- UI 디자인
- 사용자 인터랙션 설계
- 사용자 경험 개선 방향 제안

팀의 목표는 단순히 업무를 나누는 것이 아니라,
기획 → 개발 → 검증 과정이 자연스럽게 연결되는 개발 환경을 만드는 것이었습니다.

---

<h2 id="3">🤖 AI Collaboration Process</h2>

개발 기간은 제한되어 있었고,
모든 작업을 처음부터 끝까지 수작업으로 진행하는 방식에는 한계가 있었습니다.

따라서 AI를 반복 작업을 줄이고,
더 빠르게 다양한 선택지를 검토하기 위한 개발 파트너로 활용했습니다.

## 🎨 Design

활용:

- 사용자 경험 기반 이미지 생성
- 로고 및 게임 리소스 제작

사용 도구:

- Gemini
- Photoshop AI 기능

---

## 💻 Development

활용:

- 코드 작성 보조
- 리팩토링 방향 검토
- 디버깅 지원

사용 도구:

- ChatGPT Codex

---

## 🧪 Quality Assurance

활용:

- 테스트 시나리오 생성
- 예외 상황 탐색
- 게임 로직 검토

---

## 🌍 Localization

활용:

- 다국어 콘텐츠 번역
- 자연스러운 표현 검토

---

AI 활용 과정에서 중요한 점은 생성 결과를 그대로 사용하는 것이 아니었습니다.

팀 내부에서 결과를 검토하고 수정하는 과정을 거쳐,
최종 결과물의 품질을 확보했습니다.

또한 프로젝트 요구사항과 목표를 정리한 Prompting 문서를 작성하여
AI 활용 과정의 일관성을 높였습니다.

---

<h2 id="4">🏗️ Technical Implementation</h2>

## Frontend

- JavaScript
- HTML/CSS
- Progressive Web App

## Game System

- 모듈화된 게임 상태 관리
- 턴 기반 게임 루프
- 이벤트 기반 게임 액션 처리

## Game Architecture

- 게임 이벤트 처리 모듈화
- 언어 리소스와 게임 로직 분리

## Testing

- 게임 로직 자동 테스트

---

## Deployment Validation

개발 환경에서 정상적으로 동작하는 것과,
실제 서비스 환경에서 안정적으로 동작하는 것은 달랐습니다.

초기 배포 과정에서 프랑스어 지원 및 리소스 처리 문제가 발생했고,
이를 해결하기 위해:

1. 배포 환경 문제 재현
2. 원인 분석
3. Localization 구조 개선
4. 재검증

과정을 진행했습니다.

처음에는 로컬 환경에서 정상 동작하면 충분하다고 생각했지만, 실제 배포 이후 예상하지 못한 문제가 발생하면서 서비스 환경 검증의 중요성을 알게 되었습니다.

관련 글:

[Deployment Issue & Improvement](https://github.com/ulsidae/dont-take-my-gummies/blob/main/docs/verification-report.md)

---

<h2 id="5">🌍 Localization</h2>

게임은 다음 언어를 지원합니다.

- 한국어
- 영어
- 프랑스어

현지화 시스템은 게임 로직과 언어 리소스를 분리하는 구조로 설계했습니다.

이를 통해 새로운 언어 추가와 유지보수가 가능하도록 구성했습니다.

---

<h2 id="6">🧪 Engineering Decisions</h2>

## 왜 JavaScript를 선택했는가?

제한된 개발 기간 안에서 빠른 구현과 검증이 필요했습니다.

프레임워크 대신 JavaScript 기반 구조를 선택하여:

- 개발 환경 설정 비용 감소
- 게임 로직 집중
- 빠른 프로토타이핑

을 목표로 했습니다.

---

## 왜 MVP를 우선했는가?

초기에는 다양한 기능과 확장 아이디어를 계획했습니다.

<img src="https://github.com/ulsidae/dont-take-my-gummies/blob/main/docs/로드맵.png" height="400" />

하지만 개발 과정에서 기능의 개수보다
핵심 경험을 완성하는 것이 중요하다고 판단했습니다.

따라서:

> 많은 기능보다 완성된 하나의 경험 제공

을 우선순위로 설정했습니다.

이를 위해:

<img src="https://github.com/ulsidae/dont-take-my-gummies/blob/main/docs/img/3.png" height="400" />

- 개발 영역

<img src="https://github.com/ulsidae/dont-take-my-gummies/blob/main/docs/img/4.jpg" height="400" />

- 디자인 영역

으로 역할을 구분하고,
필요한 작업 단위를 나누어 일정 안에서 완성하는 것을 목표로 했습니다.

---

<h2 id="7">📈 Result</h2>

구현 결과:

✅ 플레이 가능한 보드게임 프로토타입  
✅ AI 기반 개발 workflow 구축  
✅ 다국어 지원  
✅ 자동화 테스트 환경 구성  
✅ 웹 배포 완료  

## Testing

```
44 tests passed
0 failed
```


- 3개 언어 지원
- 44개 자동화 테스트 통과
- GitHub Pages 배포

---

<h2 id="8">🚀 What I Learned</h2>

이번 프로젝트에서 AI의 가장 큰 장점은 코드를 대신 작성하는 것이 아니라, 아이디어를 구현하고 검증하는 반복 과정을 줄여준다는 점이라고 느꼈습니다.

AI는 개발자의 판단을 대신하는 도구가 아니라,
반복 작업을 줄이고 더 나은 결정을 돕는 협업 도구입니다.

또한 팀 프로젝트를 진행하며 실제 제품 개발에서는 기술 구현뿐 아니라:

- 우선순위 결정
- 일정 관리
- 역할 조율
- 사용자 경험 고려

가 함께 필요하다는 것을 경험했습니다.

**Don't Take My Gummies!** 는 아이디어를 실제 플레이 가능한 결과물로 발전시키는 과정에서,
AI와 사람이 어떻게 협업할 수 있는지를 기록한 프로젝트입니다.
