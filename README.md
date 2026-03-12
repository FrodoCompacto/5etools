# 5e.tools

Visit the [main site](https://5e.tools/index.html) or go to the unofficial GitHub [mirror](index.html).

[Join the 5etools Discord here!](https://discord.gg/5etools)

## Help and Support

Please see [our wiki](https://wiki.tercept.net/) for FAQs, installation guides, supported integrations, and more.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

This project is licensed under the terms of the MIT license.

## Rodando Localmente

1. Instalar dependências
```bash
npm install
```
2. Compilar o CSS (SCSS -> CSS)
```bash
npm run build:css
```
3. Subir o servidor local (porta 5050)
```bash
npm run serve:dev
```
4. Acessar no navegador: [http://localhost:5050](http://localhost:5050)

> Para HTTPS na porta 5051, use `npm run serve:dev:tls`.

## Atualizando Fork

- Configurar remote (apenas a primeira vez)
```bash
git remote add upstream https://github.com/user/repo.git
```
- Buscar as alterações do original
```bash
git fetch upstream
```
- Ir para a branch principal (ex.: main)
```bash
git checkout main
```
- Mesclar as alterações do original na sua branch
```bash
git merge upstream/main
```
- Enviar para o seu fork no GitHub
```bash
git push origin main
```