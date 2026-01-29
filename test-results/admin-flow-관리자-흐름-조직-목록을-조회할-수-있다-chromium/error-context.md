# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "네오인증서" [level=1] [ref=e5]
      - paragraph [ref=e6]: 의료기기 정품 인증 시스템
    - generic [ref=e7]:
      - generic [ref=e9]: 로그인
      - generic [ref=e11]:
        - generic [ref=e12]:
          - text: 이메일
          - textbox "이메일" [ref=e13]:
            - /placeholder: 이메일을 입력하세요
            - text: admin@neocert.com
        - generic [ref=e14]:
          - text: 비밀번호
          - textbox "비밀번호" [ref=e15]:
            - /placeholder: 비밀번호를 입력하세요
            - text: admin123
        - button "로그인" [ref=e16]
      - generic [ref=e17]:
        - link "비밀번호를 잊으셨나요?" [ref=e18] [cursor=pointer]:
          - /url: /reset-password
        - paragraph [ref=e19]:
          - text: 계정이 없으신가요?
          - link "회원가입" [ref=e20] [cursor=pointer]:
            - /url: /register
  - button "Open Next.js Dev Tools" [ref=e26] [cursor=pointer]:
    - img [ref=e27]
  - alert [ref=e30]
```