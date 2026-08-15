export APP_URL ?= http://localhost:8080

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

start:
	npx frontend-flight-booking-server start -s dist

preview:
	npm run preview

browsers:
	npm run test:browsers

test:
	npm run test

.PHONY: install dev build lint mock start preview browsers test
