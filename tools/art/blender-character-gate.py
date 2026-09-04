import argparse
import json
import os
import sys


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--glb', required=True)
    args, _ = parser.parse_known_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:])
    if not args.glb or args.glb == 'MISSING' or not os.path.exists(args.glb):
        sys.stdout.write(json.dumps({
            'ok': False,
            'codes': ['mesh_glb_missing'],
            'glb': args.glb,
        }) + '\n')
        return 2
    sys.stdout.write(json.dumps({'ok': True, 'glb': args.glb}) + '\n')
    return 0


if __name__ == '__main__':
    sys.exit(main())
