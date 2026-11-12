# GitHub Actions 설정 가이드

이 문서는 원본 저장소 [`xtx9/localManager`](https://github.com/xtx9/localManager)에서 공개 저장소 [`xtx9/localManagerPage`](https://github.com/xtx9/localManagerPage)로 문서를 동기화하고 GitHub Pages에 게시하는 절차를 안내합니다. `peaceunion119/localManager`는 포크이므로 원본이나 배포 실행 저장소로 사용하지 않습니다.

> **수동 실행 원칙:** 문서 동기화와 Pages 게시 모두 자동 실행하지 않습니다. 사용자가 각 저장소의 GitHub Actions에서 별도로 수동 실행해야 합니다.

## 1. 저장소와 실행 흐름

| 역할 | 저장소 | 작업 |
|---|---|---|
| 원본 | `xtx9/localManager` | 문서와 Pages workflow 원본 관리, 수동 동기화 실행 |
| 공개 대상 | `xtx9/localManagerPage` | 동기화 결과 확인, Pages 수동 게시 실행 |

전체 흐름은 다음과 같습니다.

```text
xtx9/localManager
  └─ 수동 실행: Publish localManagerPage docs
       ├─ apps/07-localManagerPage.git/docs/ → xtx9/localManagerPage/docs/
       └─ .github/workflows/pages.yml → xtx9/localManagerPage/.github/workflows/pages.yml
            └─ 수동 실행: 공개 웹 페이지 배포
                 └─ GitHub Pages 게시
```

첫 번째 workflow는 파일을 복사해 공개 저장소에 커밋/푸시할 뿐, Pages를 게시하지 않습니다. 두 번째 workflow를 직접 실행해야 웹사이트에 반영됩니다.

## 2. 대상 저장소 쓰기 토큰 준비

1. GitHub 계정으로 이동합니다.
2. 우측 상단 프로필 아이콘 > `Settings` 선택
3. 좌측 메뉴에서 `Developer settings` > `Personal access tokens` 선택
4. `Fine-grained tokens` 또는 `Tokens (classic)` 중 하나를 생성합니다.
5. 대상 저장소 `xtx9/localManagerPage`에만 필요한 권한을 부여합니다.

권장 설정:

- Repository access: `Only select repositories`
- 선택 저장소: `xtx9/localManagerPage`
- 권한:
  - `Contents`: `Read and write`
  - `Metadata`: `Read`
  - `.github/workflows/pages.yml` 갱신이 거부되면 `Workflows`: `Read and write`도 부여

> 참고: GitHub의 `Repository access` 항목은 Fine-grained 토큰에서 제공됩니다. Classic 토큰은 저장소 범위를 개별 지정할 수 없으므로 필요한 권한만 부여하고, 가능하면 Fine-grained 토큰을 사용합니다.

classic 토큰을 사용할 경우에는 다음 권한을 최소 범위로 부여합니다.

```text
repo
workflow
```

토큰 값은 코드에 넣거나 로그에 출력하지 않습니다. GitHub Actions secret으로만 보관합니다.

## 3. 원본 저장소에 시크릿 등록

`xtx9/localManager` 저장소에서 아래 절차를 따릅니다. 포크 `peaceunion119/localManager`에 등록한 시크릿은 원본 저장소 workflow에서 사용할 수 없습니다.

1. 저장소 페이지로 이동
2. `Settings` 탭 클릭
3. 좌측 메뉴에서 `Secrets and variables` > `Actions` 선택
4. `New repository secret` 클릭
5. 이름을 `LOCALMANAGERPAGE_TOKEN`으로 입력
6. 생성한 PAT 값을 붙여넣고 저장

최종 이름은 정확히 다음이어야 합니다.

```text
LOCALMANAGERPAGE_TOKEN
```

동기화 workflow는 이 토큰으로 대상 저장소를 체크아웃하고 변경 사항을 푸시합니다. secret 이름이 다르거나 대상 저장소 쓰기 권한이 없으면 workflow가 실패합니다.

```yaml
with:
  repository: xtx9/localManagerPage
  token: ${{ secrets.LOCALMANAGERPAGE_TOKEN }}
```

## 4. 공개 저장소 Pages 설정

`xtx9/localManagerPage` 저장소에서 아래를 설정합니다.

1. 저장소로 이동
2. `Settings` 탭 열기
3. 좌측 메뉴에서 `Pages` 선택
4. 빌드 및 배포 소스(Source)를 `GitHub Actions`로 설정
5. 저장소를 공개 상태로 유지

동기화 후 공개 저장소 구조는 아래와 같습니다.

```text
xtx9/localManagerPage/
├── .github/
│   └── workflows/
│       └── pages.yml
└── docs/
    ├── index.html
    ├── styles.css
    ├── script.js
    ├── manifest.json
    ├── pages/
    └── ...
```

## 5. 문서 수동 동기화

문서 변경 후 원본 저장소 `xtx9/localManager`에서만 다음 절차를 수행합니다.

1. `Actions` 탭으로 이동
2. `Publish localManagerPage docs` 선택
3. `Run workflow` 클릭
4. 배포할 원본 브랜치를 선택하고 실행
5. 실행이 성공했는지 확인

워크플로 파일은 `.github/workflows/publish-localmanagerpage.yml`이며 `workflow_dispatch`로만 시작됩니다. 자동 `push` 실행은 설정되어 있지 않습니다. 포크에서 실수로 실행하지 않도록 `xtx9/localManager` 저장소에서만 작업하도록 제한되어 있습니다.

성공 후 `xtx9/localManagerPage`에서 `docs/`와 `.github/workflows/pages.yml`의 변경 사항을 확인합니다. 이 단계까지는 파일 동기화만 완료된 상태입니다.

## 6. Pages 수동 게시

동기화가 성공한 다음에 공개 저장소 `xtx9/localManagerPage`에서 별도로 실행합니다.

1. `Actions` 탭으로 이동
2. `공개 웹 페이지 배포` 선택
3. `Run workflow`를 눌러 실행
4. 실행 완료 상태와 게시 URL을 확인

Pages workflow도 `workflow_dispatch`만 사용하므로 `docs/` 변경만으로 자동 게시되지 않습니다. 게시 URL은 다음과 같습니다.

```text
https://xtx9.github.io/localManagerPage/
```

## 7. 오류 점검

### 작업이 시작되지 않고 결제 또는 사용 한도 오류가 표시됨

다음 메시지는 workflow YAML이나 문서 파일의 오류가 아니라, 저장소를 소유한 GitHub 계정 또는 조직의 결제 상태 또는 Actions 사용 제한으로 GitHub가 job 시작을 차단했다는 뜻입니다. 이 문구만으로 어느 계정 설정이 원인인지, 실제 비용이 발생했는지는 판단할 수 없습니다.

```text
The job was not started because recent account payments have failed
or your spending limit needs to be increased.
```

1. 저장소 소유 계정 또는 조직 관리자에게 오류를 전달하고 `Settings` > `Billing & plans`에서 결제 상태와 Actions 제한을 확인하도록 요청합니다.
2. 무과금 운영이 요구되면 spending limit을 올리거나 유료 설정을 켜지 않습니다. 관리자가 과금 없이 실행 가능한지 확인합니다.
3. 실행이 허용된 상태가 확인된 뒤 사용자가 Actions에서 다시 수동 실행합니다.

이 오류가 표시되면 저장소 workflow 파일을 수정해도 해결되지 않습니다. 개인 계정이나 조직 결제 설정을 확인할 권한이 없다면 소유자/관리자에게 전달하고 확인 전에는 반복 실행하지 않습니다. 이 안내는 spending limit 상향이나 결제 변경을 권고하지 않습니다.

### Ubuntu 러너 버전 안내가 표시됨

`ubuntu-latest`가 Ubuntu 26으로 이동한다는 안내는 실행을 막는 오류가 아닙니다. 러너 버전 변경으로 동작이 바뀌지 않도록 동기화 및 Pages workflow는 `ubuntu-24.04`를 명시해 고정했습니다. 이 안내만 표시되고 job이 정상 실행됐다면 별도 조치는 필요하지 않습니다.

### 동기화 workflow에 실패가 표시됨

- `xtx9/localManager` 저장소에 `LOCALMANAGERPAGE_TOKEN` secret이 등록되어 있는지 확인합니다.
- 토큰이 `xtx9/localManagerPage`에 접근할 수 있고 `Contents: Read and write` 권한이 있는지 확인합니다.
- `.github/workflows/pages.yml` 수정 권한이 부족하다는 오류가 있으면 토큰의 workflow 파일 권한을 확인합니다.
- 동기화 workflow가 포크에서 실행된 것은 아닌지 확인합니다. 원본 저장소가 아니면 작업이 실행되지 않습니다.

### 게시 workflow 또는 페이지에 실패가 표시됨

- 공개 저장소에서 GitHub Pages를 `GitHub Actions`로 설정하지 않으면 페이지가 게시되지 않습니다.
- 동기화 성공 후 `xtx9/localManagerPage`의 `공개 웹 페이지 배포`를 별도로 실행했는지 확인합니다.
- HTML의 `href` 또는 `src`가 두 단계 이상 상위 경로(`../../`)로 나가면 동기화 workflow의 링크 검사 단계가 중단합니다. 설명 문서의 코드 예시를 찾는 것이 아니라 실제 공개 HTML 속성만 검사합니다.

## 8. 안전 운영 규칙

- 토큰은 절대 코드 저장소에 하드코딩하지 않습니다.
- 토큰 값은 로그나 출력에 노출하지 않습니다.
- 동기화와 Pages 게시를 각각 사용자가 Actions에서 수동 실행합니다.
- 공개 문서에는 비공개 문서, 비밀정보, 작업 로그, 내부 경로를 포함하지 않습니다.

## 9. 확인 체크리스트

동기화와 게시 전에 아래 항목을 확인합니다.

- [ ] 원본 저장소가 `xtx9/localManager`인지 확인했는가?
- [ ] `xtx9/localManager`에 `LOCALMANAGERPAGE_TOKEN` secret이 등록되어 있는가?
- [ ] 토큰 권한이 `Contents: Read and write`인가?
- [ ] 토큰이 공개 저장소 `xtx9/localManagerPage`에만 필요한 접근 권한을 갖는가?
- [ ] 공개 저장소에서 GitHub Pages가 `GitHub Actions`로 설정되었는가?
- [ ] 원본 Actions에서 문서 동기화를 수동 실행하고 성공을 확인했는가?
- [ ] 공개 저장소 Actions에서 Pages 게시를 별도로 수동 실행했는가?
- [ ] 공개 HTML의 `href`/`src`가 `docs/` 웹 루트 밖을 참조하지 않는가?

두 workflow가 모두 성공해야 최신 문서가 `https://xtx9.github.io/localManagerPage/`에 게시됩니다.
