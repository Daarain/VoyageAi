"""Train all models and write artifacts + metrics.json.   python train.py"""
import json
from app.config import ARTIFACTS
from app.engine import Engine

if __name__ == "__main__":
    engine, metrics = Engine.train(save=True)
    (ARTIFACTS / "metrics.json").write_text(json.dumps(metrics, indent=2, default=str))
    print(json.dumps(metrics, indent=2, default=str))
    print(f"\nArtifacts written to {ARTIFACTS}")
