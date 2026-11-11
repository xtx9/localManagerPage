# 07-localManagerPage.git

- 상태: PLANNED
- 목적: GitHub Pages 공개 문서 포털의 원본 문서 소스 관리
- 저장소 대상: `https://github.com/xtx9/localManagerPage.git`
- 정책: 자동 배포 금지, 사용자 수동 실행만 허용, 공개 문서만 포함

## 구조

```text
apps/07-localManagerPage.git/
├── README.md
├── .github/
│   └── workflows/
│       └── pages.yml                 # 공개 저장소 Pages workflow 원본
└── docs/                             # GitHub Pages 루트. 공개 저장소의 docs/ 와 동일
    ├── index.html
    ├── styles.css
    ├── script.js
    ├── manifest.json
    ├── pages/
    ├── config/
    └── data/
```

`docs/`는 GitHub Pages의 실제 루트이며, 공개 저장소 `https://github.com/xtx9/localManagerPage.git`의 `docs/`와 동일한 구조를 갖는다. 루트에 정적 페이지 파일을 두지 않고, `docs/`만 복사해 넣는 방식으로 운영한다.

개발 저장소의 내부 문서나 비공개 로그는 포함하지 않는다.

## 배포 흐름

- 소스 원본: `apps/07-localManagerPage.git/docs/`
- 공개 저장소 루트: `https://github.com/xtx9/localManagerPage.git`
- 공개 저장소 웹 루트: `docs/`
- 동기화 workflow: `.github/workflows/publish-localmanagerpage.yml`
- Pages 게시: 공개 저장소 Actions에서 `workflow_dispatch`로 사용자 수동 실행

자동 배포는 하지 않고, 사용자가 직접 실행한 sync workflow와 별도 Pages 배포만 허용한다.

## 공개 저장소 포맷

실제 공개 저장소는 아래 구조여야 한다.

```text
xtx9/localManagerPage.git/
├── .github/
│   └── workflows/
│       └── pages.yml
└── docs/
    ├── index.html
    ├── styles.css
    ├── script.js
    ├── manifest.json
    ├── pages/
    ├── config/
    └── data/
```

## 실행 단계

1. private repo에서 `LOCALMANAGERPAGE_TOKEN` 시크릿 준비
2. [.github/workflows/publish-localmanagerpage.yml](../../../.github/workflows/publish-localmanagerpage.yml) 실행
3. 공개 저장소에서 Pages workflow 수동 실행
4. 사용자 지정 도메인 `localManager.smartflex.org` 연결 확인

## 주의

- `/docs`를 루트로 사용하므로 루트 레벨에 공개 문서를 두지 않는다.
- 내부 문서, 작업 로그, 보안 정보, 비공개 설정은 포함하지 않는다.
- 사용자가 직접 실행한 GitHub Actions만 허용한다.
