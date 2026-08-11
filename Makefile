export APP_URL ?= http://localhost:5173

install:
	npm ci

dev:
	npm run dev

build:
	npm run build

lint:
	npm run lint

mock:
	npm run mock

preview:
	npm run preview

browsers:
	npm run test:browsers

test:
	npm run test

.PHONY: install dev build lint mock preview browsers test
