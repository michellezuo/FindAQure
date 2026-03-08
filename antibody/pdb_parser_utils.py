from __future__ import annotations

"""
pdb_parser_utils.py

A standalone PDB parser and structure-preprocessing module for antibody/antigen
projects. This file does NOT depend on BioPython. It is meant to support
structure-based scoring pipelines like your Grover-style docking search.

What it does:
- Parses PDB ATOM/HETATM records
- Groups atoms into residues and chains
- Computes residue centroids
- Assigns simple residue chemistry features
- Builds simple antigen patches
- Supports both manual CDR labeling and automatic binding-residue detection
- Exports simplified structure dictionaries if needed

Notes:
- This parser is intentionally focused on standard PDB fixed-width ATOM/HETATM
  lines.
- It ignores alternate locations except preferring blank or 'A'.
- It supports multi-model files, but by default only reads the first model.
- It does not perform full antibody numbering (IMGT/Kabat/Chothia).
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple
import json
import math


# =============================================================================
# Basic residue chemistry helpers
# =============================================================================

_POSITIVE = {"LYS", "ARG", "HIS"}
_NEGATIVE = {"ASP", "GLU"}
_HYDROPHOBIC = {"ALA", "VAL", "LEU", "ILE", "MET", "PHE", "TRP", "TYR", "PRO"}

THREE_TO_ONE = {
    "ALA": "A", "ARG": "R", "ASN": "N", "ASP": "D", "CYS": "C",
    "GLN": "Q", "GLU": "E", "GLY": "G", "HIS": "H", "ILE": "I",
    "LEU": "L", "LYS": "K", "MET": "M", "PHE": "F", "PRO": "P",
    "SER": "S", "THR": "T", "TRP": "W", "TYR": "Y", "VAL": "V",
}


def residue_charge(resname: str) -> int:
    resname = resname.upper()
    if resname in _POSITIVE:
        return 1
    if resname in _NEGATIVE:
        return -1
    return 0


def residue_hydrophobic(resname: str) -> bool:
    return resname.upper() in _HYDROPHOBIC


def three_to_one(resname: str) -> str:
    return THREE_TO_ONE.get(resname.upper(), "X")


def euclidean(a: List[float], b: List[float]) -> float:
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2)


# =============================================================================
# Core data classes
# =============================================================================

@dataclass
class AtomRecord:
    serial: int
    atom_name: str
    altloc: str
    resname: str
    chain: str
    resseq: int
    icode: str
    x: float
    y: float
    z: float
    occupancy: float
    bfactor: float
    element: str
    record_type: str = "ATOM"

    @property
    def coord(self) -> List[float]:
        return [self.x, self.y, self.z]


@dataclass
class Residue3D:
    chain: str
    residue_id: int
    insertion_code: str
    residue_name: str
    atoms: List[AtomRecord] = field(default_factory=list)
    centroid: List[float] = field(default_factory=list)
    charge: int = 0
    hydrophobic: bool = False
    is_cdr: bool = False

    def finalize(self) -> None:
        coords = [atom.coord for atom in self.atoms if atom.element.upper() != "H"]
        if not coords:
            coords = [atom.coord for atom in self.atoms]

        if coords:
            n = len(coords)
            self.centroid = [
                sum(pt[0] for pt in coords) / n,
                sum(pt[1] for pt in coords) / n,
                sum(pt[2] for pt in coords) / n,
            ]
        else:
            self.centroid = [0.0, 0.0, 0.0]

        self.charge = residue_charge(self.residue_name)
        self.hydrophobic = residue_hydrophobic(self.residue_name)

    def to_compact_dict(self) -> Dict:
        return {
            "chain": self.chain,
            "residue_id": self.residue_id,
            "insertion_code": self.insertion_code,
            "residue_name": self.residue_name,
            "centroid": self.centroid,
            "charge": self.charge,
            "hydrophobic": self.hydrophobic,
            "is_cdr": self.is_cdr,
        }


@dataclass
class Structure3D:
    id: str
    residues: List[Residue3D] = field(default_factory=list)

    def to_compact_dict(self) -> Dict:
        return {
            "id": self.id,
            "residues": [res.to_compact_dict() for res in self.residues],
        }

    def save_compact_json(self, out_path: str | Path) -> None:
        path = Path(out_path)
        path.write_text(json.dumps(self.to_compact_dict(), indent=2), encoding="utf-8")

    def sequence_by_chain(self) -> Dict[str, str]:
        out: Dict[str, List[str]] = {}
        for res in self.residues:
            out.setdefault(res.chain, []).append(three_to_one(res.residue_name))
        return {chain: "".join(seq) for chain, seq in out.items()}


@dataclass
class AntibodyStructure:
    id: str
    residues: List[Residue3D]
    cdr_indices: List[int]

    def to_compact_dict(self) -> Dict:
        return {
            "id": self.id,
            "cdr_indices": self.cdr_indices,
            "residues": [res.to_compact_dict() for res in self.residues],
        }


@dataclass
class AntigenPatch:
    patch_id: int
    residue_indices: List[int]
    centroid: List[float]

    def to_dict(self) -> Dict:
        return {
            "patch_id": self.patch_id,
            "residue_indices": self.residue_indices,
            "centroid": self.centroid,
        }


# =============================================================================
# PDB parsing
# =============================================================================

def _safe_int(text: str, default: int = 0) -> int:
    text = text.strip()
    return int(text) if text else default


def _safe_float(text: str, default: float = 0.0) -> float:
    text = text.strip()
    return float(text) if text else default


def parse_pdb_atom_line(line: str) -> Optional[AtomRecord]:
    """Parse a fixed-width PDB ATOM/HETATM line into an AtomRecord."""
    if not (line.startswith("ATOM") or line.startswith("HETATM")):
        return None

    record_type = line[0:6].strip()
    serial = _safe_int(line[6:11])
    atom_name = line[12:16].strip()
    altloc = line[16:17].strip()
    resname = line[17:20].strip()
    chain = line[21:22].strip() or "_"
    resseq = _safe_int(line[22:26])
    icode = line[26:27].strip()
    x = _safe_float(line[30:38])
    y = _safe_float(line[38:46])
    z = _safe_float(line[46:54])
    occupancy = _safe_float(line[54:60], 1.0)
    bfactor = _safe_float(line[60:66], 0.0)
    element = line[76:78].strip() if len(line) >= 78 else ""
    if not element and atom_name:
        element = atom_name[0].upper()

    return AtomRecord(
        serial=serial,
        atom_name=atom_name,
        altloc=altloc,
        resname=resname,
        chain=chain,
        resseq=resseq,
        icode=icode,
        x=x,
        y=y,
        z=z,
        occupancy=occupancy,
        bfactor=bfactor,
        element=element,
        record_type=record_type,
    )


def parse_pdb_file(
    pdb_path: str | Path,
    structure_id: Optional[str] = None,
    include_hetatm: bool = False,
    first_model_only: bool = True,
) -> Structure3D:
    """
    Parse a PDB file into a Structure3D.

    Parameters
    ----------
    pdb_path:
        Path to the input .pdb file.
    structure_id:
        Optional structure identifier. Defaults to file stem.
    include_hetatm:
        Whether to include HETATM records.
    first_model_only:
        If True, stop after the first MODEL/ENDMDL block (or just parse the
        first model in a single-model file).
    """
    path = Path(pdb_path)
    sid = structure_id or path.stem

    residue_map: Dict[Tuple[str, int, str, str], Residue3D] = {}
    seen_model = False
    in_model = False

    with path.open("r", encoding="utf-8", errors="ignore") as f:
        for raw_line in f:
            line = raw_line.rstrip("\n")

            if line.startswith("MODEL"):
                if first_model_only and seen_model:
                    break
                in_model = True
                seen_model = True
                continue

            if line.startswith("ENDMDL"):
                if first_model_only:
                    break
                in_model = False
                continue

            if first_model_only and seen_model and not in_model:
                continue

            if not (line.startswith("ATOM") or line.startswith("HETATM")):
                continue

            atom = parse_pdb_atom_line(line)
            if atom is None:
                continue

            if atom.record_type == "HETATM" and not include_hetatm:
                continue

            if atom.altloc not in {"", "A"}:
                continue

            key = (atom.chain, atom.resseq, atom.icode, atom.resname)
            if key not in residue_map:
                residue_map[key] = Residue3D(
                    chain=atom.chain,
                    residue_id=atom.resseq,
                    insertion_code=atom.icode,
                    residue_name=atom.resname,
                )
            residue_map[key].atoms.append(atom)

    residues = list(residue_map.values())
    residues.sort(key=lambda r: (r.chain, r.residue_id, r.insertion_code))

    for residue in residues:
        residue.finalize()

    return Structure3D(id=sid, residues=residues)


# =============================================================================
# Antibody residue selection helpers
# =============================================================================

def mark_cdrs_by_ranges(
    structure: Structure3D,
    chain_to_ranges: Dict[str, List[Tuple[int, int]]],
) -> AntibodyStructure:
    """
    Mark residues as CDRs if their chain + residue_id falls in any supplied range.

    Example:
        chain_to_ranges = {
            "H": [(26, 32), (52, 56), (95, 102)],
            "L": [(24, 34), (50, 56), (89, 97)],
        }
    """
    cdr_indices: List[int] = []

    for i, residue in enumerate(structure.residues):
        ranges = chain_to_ranges.get(residue.chain, [])
        in_any = any(start <= residue.residue_id <= end for start, end in ranges)
        residue.is_cdr = in_any
        if in_any:
            cdr_indices.append(i)

    return AntibodyStructure(
        id=structure.id,
        residues=structure.residues,
        cdr_indices=cdr_indices,
    )


def auto_detect_binding_residues(structure: Structure3D) -> AntibodyStructure:
    """
    Heuristic fallback for antibody-like binders when explicit CDR ranges are
    unavailable.

    Strategy:
    - group residues by chain
    - choose the longest chain
    - use the central 60% of that chain as candidate binding residues

    This is not true antibody numbering, but it removes dependence on hardcoded
    chain labels and Kabat/IMGT residue ranges.
    """
    if not structure.residues:
        return AntibodyStructure(
            id=structure.id,
            residues=structure.residues,
            cdr_indices=[],
        )

    chains: Dict[str, List[int]] = {}
    for i, residue in enumerate(structure.residues):
        chains.setdefault(residue.chain, []).append(i)

    longest_chain = max(chains.items(), key=lambda x: len(x[1]))[0]
    chain_indices = chains[longest_chain]

    start = int(len(chain_indices) * 0.2)
    end = int(len(chain_indices) * 0.8)
    selected = chain_indices[start:end]

    for residue in structure.residues:
        residue.is_cdr = False
    for i in selected:
        structure.residues[i].is_cdr = True

    return AntibodyStructure(
        id=structure.id,
        residues=structure.residues,
        cdr_indices=selected,
    )


# =============================================================================
# Patch building
# =============================================================================

def build_simple_patches(
    antigen: Structure3D,
    patch_size: int = 4,
    step: int = 2,
    chain_filter: Optional[Iterable[str]] = None,
) -> List[AntigenPatch]:
    """
    Build simple residue patches from antigen residues using a sliding window.

    This is not true surface-patch extraction, but it is simple and useful for a
    first structure-based scoring prototype.
    """
    if patch_size <= 0:
        raise ValueError("patch_size must be positive")
    if step <= 0:
        raise ValueError("step must be positive")

    allowed = set(chain_filter) if chain_filter is not None else None
    idxs = [
        i for i, res in enumerate(antigen.residues)
        if allowed is None or res.chain in allowed
    ]

    patches: List[AntigenPatch] = []
    if not idxs:
        return patches

    for start in range(0, max(1, len(idxs) - patch_size + 1), step):
        window = idxs[start:start + patch_size]
        if not window:
            continue

        coords = [antigen.residues[i].centroid for i in window]
        n = len(coords)
        centroid = [
            sum(c[0] for c in coords) / n,
            sum(c[1] for c in coords) / n,
            sum(c[2] for c in coords) / n,
        ]

        patches.append(
            AntigenPatch(
                patch_id=len(patches),
                residue_indices=window,
                centroid=centroid,
            )
        )

    return patches


# =============================================================================
# Scoring utility for your Grover project
# =============================================================================

def score_docking_patch(
    antigen: Structure3D,
    antibody: AntibodyStructure,
    patches: List[AntigenPatch],
    patch_idx: int,
    contact_cutoff: float = 8.0,
    clash_cutoff: float = 2.5,
) -> float:
    """
    Score one antigen patch against antibody CDR/binding residues.

    This is a simple, interpretable, hackathon-friendly score. It is not a full
    molecular docking energy function.
    """
    if patch_idx < 0 or patch_idx >= len(patches):
        return 0.0

    patch = patches[patch_idx]
    patch_residues = [antigen.residues[i] for i in patch.residue_indices]
    cdr_residues = [antibody.residues[i] for i in antibody.cdr_indices]

    if not patch_residues or not cdr_residues:
        return 0.0

    total_pairs = len(patch_residues) * len(cdr_residues)
    if total_pairs == 0:
        return 0.0

    contact_count = 0
    favorable_charge = 0
    hydrophobic_pairs = 0
    clash_penalty = 0

    for ab_res in cdr_residues:
        for ag_res in patch_residues:
            d = euclidean(ab_res.centroid, ag_res.centroid)

            if d < contact_cutoff:
                contact_count += 1
                if ab_res.charge * ag_res.charge < 0:
                    favorable_charge += 1
                if ab_res.hydrophobic and ag_res.hydrophobic:
                    hydrophobic_pairs += 1

            if d < clash_cutoff:
                clash_penalty += 1

    contact_score = contact_count / total_pairs
    charge_score = favorable_charge / total_pairs
    hydro_score = hydrophobic_pairs / total_pairs
    clash_score = clash_penalty / total_pairs

    score = (
        0.45 * contact_score +
        0.30 * charge_score +
        0.20 * hydro_score -
        0.25 * clash_score
    )

    return max(0.0, min(1.0, score))


# =============================================================================
# Convenience helpers
# =============================================================================

def summarize_structure(structure: Structure3D) -> Dict:
    chains: Dict[str, int] = {}
    for residue in structure.residues:
        chains[residue.chain] = chains.get(residue.chain, 0) + 1

    return {
        "id": structure.id,
        "num_residues": len(structure.residues),
        "chains": chains,
        "sequences": structure.sequence_by_chain(),
    }


# =============================================================================
# Example CLI usage
# =============================================================================

def _demo() -> None:
    """
    Example:
        python pdb_parser_utils.py antigen.pdb antibody.pdb
    """
    import sys

    if len(sys.argv) < 3:
        print("Usage: python pdb_parser_utils.py <antigen.pdb> <antibody.pdb>")
        return

    antigen_path = sys.argv[1]
    antibody_path = sys.argv[2]

    antigen = parse_pdb_file(antigen_path, structure_id="antigen")
    antibody_raw = parse_pdb_file(antibody_path, structure_id="antibody")

    print("Antigen summary:")
    print(json.dumps(summarize_structure(antigen), indent=2))
    print()

    print("Antibody summary:")
    print(json.dumps(summarize_structure(antibody_raw), indent=2))
    print()

    antibody = auto_detect_binding_residues(antibody_raw)
    print(f"Auto-detected {len(antibody.cdr_indices)} candidate binding residues")
    print()

    patches = build_simple_patches(antigen, patch_size=4, step=2)
    print(f"Built {len(patches)} antigen patches")

    if patches:
        first_score = score_docking_patch(antigen, antibody, patches, 0)
        print(f"Patch 0 score vs antibody binding residues: {first_score:.4f}")

    antigen.save_compact_json("antigen_compact.json")
    print("Saved compact antigen JSON -> antigen_compact.json")


if __name__ == "__main__":
    _demo()
