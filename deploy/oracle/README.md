# Worker + Redis na VM Oracle (Always Free)

A VM roda o **worker** (pm2) e o **Redis**. O Vercel fala com o Redis pela
porta **6380 com TLS**; o worker usa a porta 6379, que só existe dentro da VM.

```
Vercel ──rediss:// :6380 (TLS, certificado Let's Encrypt)──▶ Redis (Docker)
worker (pm2) ──redis:// 127.0.0.1:6379──────────────────────▶ Redis (Docker)
Vercel + worker ──TLS──▶ Neon
```

## Arquivos

| Arquivo | Para quê |
| --- | --- |
| `setup-vm.sh` | Instala Docker, Node 24, pm2, swap e abre a porta 6380 no iptables |
| `redis/redis.conf` | TLS na 6380, AOF, `noeviction`, 256 MB |
| `redis/docker-compose.yml` | Publica 6379 só em 127.0.0.1 e 6380 na internet |
| `redis/make-acl.sh` | Gera `users.acl` com senha aleatória (desativa o usuário `default`) |
| `redis/issue-cert.sh` | Certificado Let's Encrypt via DuckDNS, com renovação automática |
| `ecosystem.config.cjs` | Mantém o worker ligado com pm2 |
| `worker.env.example` | Modelo do `.env` do worker |

`redis/users.acl` e `redis/tls/` contêm segredos e são ignorados pelo git.

## 1. Criar a VM (console da Oracle)

1. **Compute → Instances → Create instance**.
2. **Image:** Canonical Ubuntu 24.04 (ou 22.04).
3. **Shape:** `VM.Standard.A1.Flex` (Ampere, 1 OCPU / 6 GB) se houver
   capacidade; senão `VM.Standard.E2.1.Micro`. Ambos são Always Free.
4. **Networking:** VCN padrão, sub-rede **pública**, *Assign public IPv4* ligado.
5. **SSH keys:** gere um par e baixe a chave privada (ou cole sua chave pública).
6. Crie e anote o **IP público**.

## 2. Abrir a porta 6380 na Oracle

**Networking → Virtual cloud networks → (sua VCN) → Security Lists → Default
→ Add Ingress Rules:** Source CIDR `0.0.0.0/0`, TCP, Destination port `6380`.
Não abra a 6379.

## 3. DuckDNS

Em duckdns.org (login com GitHub), crie um subdomínio, por exemplo
`openreply-redis`, aponte para o IP público da VM e copie o **token**.

## 4. Na VM

```bash
ssh ubuntu@IP_DA_VM
git clone -b deploy/meta-callbacks-and-local-fixes https://github.com/ArthurCedro/openreply.git
cd openreply && ./deploy/oracle/setup-vm.sh
exit   # entre de novo para o grupo docker valer
```

```bash
cd ~/openreply/deploy/oracle/redis
./make-acl.sh                       # guarde a senha exibida
DUCKDNS_TOKEN=... ./issue-cert.sh openreply-redis.duckdns.org seu@email
docker compose up -d && docker compose ps
```

## 5. Worker

```bash
cd ~/openreply
cp deploy/oracle/worker.env.example .env && chmod 600 .env && nano .env
npm ci && npm run db:generate
pm2 start deploy/oracle/ecosystem.config.cjs && pm2 save && pm2 startup
pm2 logs openreply-worker --lines 20
```

## 6. Vercel

`REDIS_URL=rediss://openreply:SENHA@openreply-redis.duckdns.org:6380`

## Verificação

Do seu Mac:

```bash
redis-cli --tls -u "rediss://openreply:SENHA@openreply-redis.duckdns.org:6380" ping
nc -z -G 5 openreply-redis.duckdns.org 6379 || echo "6379 fechada (correto)"
```

## Manutenção

- Certificado: renovado pelo cron do acme.sh, que reinicia o Redis.
- Atualizar o worker: `git pull && npm ci && npm run db:generate && pm2 restart openreply-worker`.
- Trocar a senha: apague `users.acl`, rode `make-acl.sh`, `docker compose restart`,
  e atualize o `.env` do worker e o `REDIS_URL` na Vercel.
- A Oracle pode recuperar VMs Always Free ociosas; o worker mantém uso de CPU,
  mas acompanhe os avisos por e-mail da Oracle.
