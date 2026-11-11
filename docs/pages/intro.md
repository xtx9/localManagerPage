# localManager 공개 문서

localManager는 프로젝트와 메모, 작업, 일정, 문서를 로컬 우선으로 관리하는 멀티플랫폼 도구입니다. 이 문서 뷰어에서는 플랫폼별 사용 방법과 개발 가이드를 확인할 수 있습니다.

## 먼저 읽기

- **사용 가이드**에서 플랫폼별 주요 흐름과 권장 사용 상황을 확인합니다.
- **개발 가이드**에서 모노레포 구조와 검증 원칙을 확인합니다.
- **플랫폼** 메뉴에서 VS Code, Windows, Android, Web/PWA, Browser Extension의 안내를 확인합니다.

> 문서의 메뉴와 경로는 `manifest.json`에서 관리합니다. 각 문서는 별도 파일로 제공됩니다.

## 문서 예시

```javascript
const documentPath = './pages/intro.md';
```

GitHub Pages의 저장소 하위 경로에서도 동작하도록 모든 문서 경로는 상대 경로로 지정합니다.
