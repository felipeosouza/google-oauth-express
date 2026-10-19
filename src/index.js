import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
const PORT = 3000;
const client = new OAuth2Client(
process.env.GOOGLE_CLIENT_ID,
process.env.GOOGLE_CLIENT_SECRET,
process.env.GOOGLE_REDIRECT_URI
);
app.get('/', (req, res) => {
const url = client.generateAuthUrl({
access_type: 'offline',
scope: ['email', 'profile', 'openid'],
});
res.send(`<a href="${url}">Login com Google</a>`);
});

app.get('/logout', (req, res) => {
// Limpa credenciais em memória e volta para a tela inicial.
client.setCredentials({});
res.redirect('/');
});

app.get('/callback', async (req, res) => {
try {
const { code } = req.query;
const { tokens } = await client.getToken(code);
client.setCredentials(tokens);
const ticket = await client.verifyIdToken({
idToken: tokens.id_token,
audience: process.env.GOOGLE_CLIENT_ID,
});
const payload = ticket.getPayload();
const name = encodeURIComponent(payload.name);
const email = encodeURIComponent(payload.email);
const normalizedEmail = (payload.email || '').toLowerCase();

// Prioriza e-mail de estudante; em seguida professor; caso contrário visitante.
if (normalizedEmail.includes('@estudante')) {
res.redirect(`/student?name=${name}&email=${email}`);
return;
}

if (normalizedEmail.includes('@ufjf.br')) {
res.redirect(`/professor?name=${name}&email=${email}`);
return;
}

res.redirect(`/visitante?name=${name}&email=${email}`);
} catch (error) {
console.error('Erro na autenticação:', error);
res.status(500).send('Erro ao autenticar com o Google.');
}
});
app.get('/student', (req, res) => {
const { name, email } = req.query;

res.send(`
<h1>Area do Aluno</h1>
<h2>Bem-vindo, ${name}!</h2>
<p>Seu e-mail: ${email}</p>
<p>Você tem acesso aos materiais das disciplinas em que está matriculado.</p>
<a href="/logout">Sair</a>
`);
});

app.get('/professor', (req, res) => {
const { name, email } = req.query;

res.send(`
<h1>Area do Professor</h1>
<h2>Bem-vindo, ${name}!</h2>
<p>Seu e-mail: ${email}</p>
<p>Você tem pode acessar e modificar os materiais das disciplinas que leciona.</p>
<a href="/logout">Sair</a>
`);
});

app.get('/visitante', (req, res) => {
const { name, email } = req.query;

res.send(`
<h1>Area do Visitante</h1>
<h2>Bem-vindo, ${name}!</h2>
<p>Seu e-mail: ${email}</p>
<p>Você não tem acesso a áreas restritas.</p>
<a href="/logout">Sair</a>
`);
});
app.listen(PORT, () => {
console.log(`Servidor rodando em http://localhost:${PORT}`);
});