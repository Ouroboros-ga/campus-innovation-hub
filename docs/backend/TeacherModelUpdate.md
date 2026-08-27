# TeacherModelUpdate.md

## Frozen Model

```text
identity_type
├─ STUDENT
└─ TEACHER

platform_role
├─ USER
└─ OPERATOR

is_superuser = true
└─ SUPERADMIN

OrganizationMembership.role
├─ MEMBER
├─ LEADER
└─ ADVISOR
```

Key rules:

- `ADVISOR` requires `identity_type = TEACHER`.
- `LEADER` and `ADVISOR` have the same V0.1 management capability only for their own organization.
- Teacher identity alone grants no platform or organization management permission.
- OPERATOR does not automatically manage organizations.
- Teacher accounts do not use the student self-registration page.
- Teacher accounts are created/imported by SUPERADMIN.
- Organization advisor is no longer stored as `advisor_name`; it is derived from Membership.
- Recruitment acceptance only creates MEMBER.
- V0.1 does not introduce teacher-specific portal, teacher approval workflow, or multi-stage organization approval.

- Public organization advisor name comes from teacher profile `public_name`; account `real_name` remains SENSITIVE.
