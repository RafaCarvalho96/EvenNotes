# Gerar Ralph prd
skill: skills/PrdParser.md
file: prds/07-prd-security-quality-observability.md
output: ralph/prd-security.json
Utilize a skill ${skill} e então com base na base #file:01-master-prd-evennotes.md e gere o prd json de ${file} com output em ${output}

## Incremental
### Front 12
file: ralph/prd-frontend.json
actual-case: 7
last-case: 12
Verifique passes e notes do US-00${actual-case - 1}, se passed implemente US-00${actual-case} de @${file}. Se não, reveja a implementação e corrija.

### Back 11
file: ralph/prd-backend.json
actual-case: 8
last-case: 11
Verifique passes e notes do US-00${actual-case - 1}, se passed implemente US-00${actual-case} de @${file}. Se não, reveja a implementação e corrija.

### CLI 11
file: ralph/prd-ai-pipeline-cli.json
actual-case: 7
last-case: 11
Verifique passes e notes do US-00${actual-case - 1}, se passed implemente US-00${actual-case} de @${file}. Se não, reveja a implementação e corrija.

### Devops compose 07
file: ralph/prd-devops.json
actual-case: 1
last-case: 7
Verifique passes e notes do US-00${actual-case - 1}, se passed implemente US-00${actual-case} de @${file}. Se não, reveja a implementação e corrija.

### Monorepo 10
file: ralph/prd-monorepo.json
actual-case: 1
last-case: 10
Verifique passes e notes do US-00${actual-case - 1}, se passed implemente US-00${actual-case} de @${file}. Se não, reveja a implementação e corrija.

### Security 12
file: ralph/prd-security.json
actual-case: 1
last-case: 12
Verifique passes e notes do US-00${actual-case - 1}, se passed implemente US-00${actual-case} de @${file}. Se não, reveja a implementação e corrija.
