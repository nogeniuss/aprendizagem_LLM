
---
# 📚 APIs para Projeto Financeiro

## 1. BrasilAPI

| Nome da API | Endpoint | Parâmetros | Função | Exemplo real |
|:---|:---|:---|:---|:---|
| BrasilAPI | `/api/taxas/v1/selic` | Nenhum | Retorna a taxa SELIC atualizada. | `GET https://brasilapi.com.br/api/taxas/v1/selic` |
| BrasilAPI | `/api/taxas/v1/cdi` | Nenhum | Retorna a taxa CDI atualizada. | `GET https://brasilapi.com.br/api/taxas/v1/cdi` |
| BrasilAPI | `/api/taxas/v1/ipca` | Nenhum | Retorna a taxa IPCA atualizada. | `GET https://brasilapi.com.br/api/taxas/v1/ipca` |
| BrasilAPI | `/api/banks/v1` | Nenhum | Lista bancos registrados no Brasil. | `GET https://brasilapi.com.br/api/banks/v1` |

---

## 2. NewsAPI

| Nome da API | Endpoint | Parâmetros | Função | Exemplo real |
|:---|:---|:---|:---|:---|
| NewsAPI | `/v2/top-headlines` | `apiKey`, `category`, `language`, `country`, `pageSize`, `page` | Retorna principais manchetes por categoria e idioma. | `GET https://newsapi.org/v2/top-headlines?category=business&language=pt&apiKey=YOUR_API_KEY` |
| NewsAPI | `/v2/everything` | `apiKey`, `q`, `language`, `pageSize`, `page` | Busca notícias sobre um termo específico. | `GET https://newsapi.org/v2/everything?q=economia&language=pt&apiKey=YOUR_API_KEY` |

---

## ⚠️ Observações Importantes

- **BrasilAPI**: Não requer autenticação (livre para uso).
- **NewsAPI**: É necessário informar uma `apiKey` válida. Plano gratuito com limite de 100 requisições/dia.
- As respostas de todas APIs são no formato **JSON**.
- As APIs são ideais para:
  - Indicadores econômicos (BrasilAPI).
  - Notícias financeiras e de mercado (NewsAPI).

---

### 🔥 Dicas adicionais:
- Para produção, ideal salvar o retorno das APIs no **MongoDB** para ter controle histórico e resposta rápida no seu projeto.
- Pode agendar atualizações automáticas com `cron jobs` (ex: atualizar dados a cada 1h).

---

# ✍️ Autor
- Projeto: **Economia Hoje**
- Backend: **Node.js + Express**
- Banco de Dados: **MongoDB**

---
