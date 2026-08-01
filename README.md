# Cinefilo Web 🎬

Um web app moderno, responsivo e interativo para cinéfilos acompanharem filmes assistidos, compartilharem críticas, e acompanharem o ranking de amigos através da "Jornada do Herói".

## Tecnologias Utilizadas
- **React + TypeScript:** Interface de usuário robusta e segura.
- **Vite:** Build tool ultrarrápido.
- **Supabase + AstraDB:** Backend e banco de dados para sincronização em tempo real.
- **TMDB API:** Consulta dinâmica do catálogo de filmes.
- **CSS Vanilla (Glassmorphism):** Design limpo e moderno sem dependência excessiva de frameworks CSS.

## Recursos
- **Sincronização em Nuvem:** Seus filmes assistidos nunca se perdem graças à blindagem de dados no backend.
- **Responsividade:** Navegue fluidamente no Desktop, Tablet ou pelo Celular usando a *Bottom Tab Bar*.
- **Listas Personalizadas:** Crie listas de filmes tematizadas e compartilhe.
- **Roleta de Filmes:** Descubra algo novo para assistir baseado nas suas preferências.
- **Jornada do Herói (XP):** Ganhe experiência por cada filme assistido, complete desafios e suba de nível!

## Instalação Local

1. Instale as dependências:
   \`\`\`bash
   npm install
   \`\`\`

2. Crie um arquivo \`.env\` (veja \`.env.example\`) com as chaves do Supabase e TMDB.

3. Inicie o servidor local:
   \`\`\`bash
   npm run dev
   \`\`\`

## Build
Para preparar a versão de produção:
\`\`\`bash
npm run build
\`\`\`
