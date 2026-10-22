"""Local-only launcher for the compiled game. Requires only Python 3 standard library."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import argparse
import threading
import webbrowser

def main():
    parser = argparse.ArgumentParser(description='Abrir Valdora no navegador')
    parser.add_argument('--port', type=int, default=8000)
    parser.add_argument('--no-browser', action='store_true')
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    folder = next((p for p in [root/'jogar', root/'dist'] if (p/'index.html').is_file()), None)
    if folder is None:
        parser.exit(1, 'Build não encontrado. Baixe o pacote Valdora-jogavel.zip ou execute npm run build no projeto.\n')
    handler = partial(SimpleHTTPRequestHandler, directory=str(folder))
    try:
        server = ThreadingHTTPServer(('127.0.0.1', args.port), handler)
    except OSError:
        server = ThreadingHTTPServer(('127.0.0.1', 0), handler)
    address = 'http://127.0.0.1:' + str(server.server_port)
    print('\nVALDORA — A PRIMEIRA FATIA\nAbra: '+address+'\nDeixe este terminal aberto. Ctrl+C encerra o jogo.\n', flush=True)
    if not args.no_browser:
        threading.Timer(.6, lambda: webbrowser.open(address)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nAté a próxima fatia!')
    finally:
        server.server_close()

if __name__ == '__main__':
    main()
