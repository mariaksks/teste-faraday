const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const crypto = require("crypto");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // Ativa o CORS para todas as rotas
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Banco de Dados
const caminhoBanco = "TESTE.db";
const banco = new sqlite3.Database(caminhoBanco);

banco.run(`CREATE TABLE IF NOT EXISTS usuario (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    NOME TEXT NOT NULL,
    EMAIL TEXT NOT NULL UNIQUE,
    SENHA TEXT NOT NULL,
    SALT TEXT NOT NULL
)`);

// Função de Hashing com Salt
function hashedSenha(senha, salt) {
  // Cria o hash usando o PBKDF2 com SHA-1
  const hash = crypto.pbkdf2Sync(senha, salt, 65536, 24, "sha1");
  return hash.toString("base64"); // Retorna o hash em base64 para compatibilidade com o Android
}

// Rota para Criar Usuário
app.post("/criarUsuario", (req, res) => {
  const { nome, email, senha } = req.body;

  if (!senha) {
    return res.status(400).json({ message: "Necessário a senha" });
  }

  // Gera o salt aleatório
  const salt = crypto.randomBytes(16).toString("base64");
  const senhaHashed = hashedSenha(senha, salt);

  banco.run(
    `INSERT INTO usuario (NOME, EMAIL, SENHA, SALT) VALUES (?, ?, ?, ?)`,
    [nome, email, senhaHashed, salt],
    function (err) {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.json({ message: "Usuário criado com sucesso" });
    }
  );
});

// Rota para Login (Autenticação)
app.post("/login", (req, res) => {
  const { nome, senha } = req.body;
  console.log(req.body); // Verifique o que está sendo enviado

  if (!nome || !senha) {
    return res.status(400).json({ message: "Nome e senha são obrigatórios" });
  }

  banco.get(
    `SELECT * FROM usuario WHERE nome = ?`,
    [nome],
    function (err, row) {
      if (err) {
        return res.status(500).send(err.message);
      }

      if (row) {
        // Gera o hash da senha usando o salt armazenado
        const senhaHashed = hashedSenha(senha, row.SALT);

        // Compara o hash da senha fornecida com o hash armazenado
        if (senhaHashed === row.SENHA) {
          console.log("Usuário encontrado e senha válida");
          return res.json({ message: "Login bem-sucedido" });
        } else {
          console.log("Senha incorreta");
          return res.status(401).json({ message: "Senha incorreta" });
        }
      } else {
        console.log("Usuário não encontrado");
        return res.status(401).json({ message: "Usuário não encontrado" });
      }
    }
  );
});

// Rota inicial
app.get("/", (req, res) => {
  res.send("Bem-vindo ao servidor!");
});

// Rota para teste
app.get("/teste", (req, res) => {
  res.send("Passei por aqui!");
});

// Rota para ver todos os usuários
app.get("/tudo", (req, res) => {
  banco.all(`SELECT * FROM usuario`, [], (err, rows) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json(rows);
  });
});


app.post("/deletar", (req, res) => {
  const{nome, email, senha} = req.body;
  console(req.body);


  if(!nome || email && senha){
    
  }
});

// Inicializa o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
