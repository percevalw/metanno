# Contributing

## Installation

Metanno needs Node.js 22, Python 3.10 or later, and a Pret checkout next to it: Metanno's browser code imports the
`pret` JavaScript package. Its browser assets are built with the JupyterLab 3 builder.

```bash
git clone --recursive https://github.com/percevalw/pret.git
git clone --recursive https://github.com/percevalw/metanno.git
cd metanno
npm --prefix ../pret install
yarn install
yarn --cwd ../pret link
yarn link pret
pip install 'jupyterlab>=3.6,<4' hatchling editables hatch-jupyter-builder
pip install --no-build-isolation -e '../pret[testing]' -e '.[testing]' --group dev
npx playwright install chromium firefox
```

## Tests

```bash
python -m pret.testing run
python -m pret.testing run --suite python
python -m pret.testing run --suite jupyter --match sessions
```

The suites run with Pret's test runner, see [Pret's contributing guide](https://github.com/percevalw/pret/blob/main/CONTRIBUTING.md).

## Test coverage

```bash
PRET_COVERAGE=1 pip install --no-build-isolation -e '../pret[coverage]' -e '.[coverage]'
python -m pret.testing run --coverage
```

Open `coverage/combined/index.html` to see the Python, JavaScript and TypeScript lines of Pret and Metanno run by
each test.

## Documentation

```bash
pip install -e . --group docs
mkdocs serve
```
