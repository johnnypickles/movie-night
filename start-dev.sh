#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export DATABASE_URL="file:./dev.db"
cd "/Users/matthewryan/Desktop/Claude Projects/movie-night"
npx next dev
