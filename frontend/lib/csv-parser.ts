import { Element } from './periodic-table-data';

function getElementCategory(category: string): string {
  const categoryMap: { [key: string]: string } = {
    'alkali metal': 'alkali metal',
    'alkaline earth metal': 'alkaline earth metal',
    'transition metal': 'transition metal',
    'post-transition metal': 'post-transition metal',
    'metalloid': 'metalloid',
    'nonmetal': 'nonmetal',
    'diatomic nonmetal': 'nonmetal',
    'polyatomic nonmetal': 'nonmetal',
    'halogen': 'halogen',
    'noble gas': 'noble gas',
  };
  return categoryMap[category.toLowerCase()] || category;
}

function getElementBlock(blockStr: string): string {
  return blockStr.toLowerCase().trim() || 'unknown';
}

function getElementState(phase: string): 'solid' | 'liquid' | 'gas' | 'unknown' {
  const phaseMap: { [key: string]: 'solid' | 'liquid' | 'gas' } = {
    'solid': 'solid',
    'liquid': 'liquid',
    'gas': 'gas',
  };
  return phaseMap[phase.toLowerCase()] || 'unknown';
}

function getReactivity(category: string): 'very reactive' | 'reactive' | 'moderately reactive' | 'low reactivity' | 'inert' {
  const catLower = category.toLowerCase();
  if (catLower.includes('alkali')) return 'very reactive';
  if (catLower.includes('halogen')) return 'very reactive';
  if (catLower.includes('alkaline earth')) return 'reactive';
  if (catLower.includes('transition')) return 'reactive';
  if (catLower.includes('noble')) return 'inert';
  if (catLower.includes('nonmetal')) return 'reactive';
  if (catLower.includes('metalloid')) return 'moderately reactive';
  return 'moderately reactive';
}

function getValenceElectrons(electronConfig: string): number {
  // Try to extract from electron configuration semantic format
  const match = electronConfig.match(/(\d)([spdf])(\d+)/g);
  if (!match) return 0;
  const lastOrbital = match[match.length - 1];
  const numMatch = lastOrbital.match(/\d+$/);
  return numMatch ? parseInt(numMatch[0]) : 0;
}

function parseHexColor(hex: string): string {
  const cleanHex = hex.trim().toUpperCase();
  if (cleanHex.length === 6 || cleanHex.length === 3) {
    return '#' + cleanHex;
  }
  return '#808080'; // default gray
}

function parseIonizationEnergy(energyStr: string): number | undefined {
  if (!energyStr || energyStr.trim() === '') return undefined;
  // Parse array format like "[1312, 2252, ...]" - take first value
  const match = energyStr.match(/\[([\d.]+)/);
  if (match) {
    return parseFloat(match[1]);
  }
  return undefined;
}

function parseElectronAffinity(affinityStr: string): number | undefined {
  if (!affinityStr || affinityStr.trim() === '') return undefined;
  const num = parseFloat(affinityStr);
  return isNaN(num) ? undefined : num;
}

function parseElectronegativity(engStr: string): number | undefined {
  if (!engStr || engStr.trim() === '') return undefined;
  const num = parseFloat(engStr);
  return isNaN(num) ? undefined : num;
}

function parseAtomicRadius(radiusStr: string, shellsStr: string): number | undefined {
  if (radiusStr && radiusStr.trim() !== '') {
    const value = parseFloat(radiusStr);
    if (!Number.isNaN(value) && value > 0) return value;
  }

  // do not derive from shells; if atomic radius is missing, keep undefined
  return undefined;
}

export function parseCSVData(csvText: string): Element[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim().toLowerCase());

  const elements: Element[] = [];

  for (let i = 1; i < lines.length; i++) {
    // CSV parsing with quoted field support
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];

      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());

    // Create row object
    const row: any = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });

    // Map CSV to Element type
    const atomicNumber = parseInt(row.number || row.atomic_number || '0');
    const symbol = (row.symbol || '').trim();
    const name = (row.name || '').trim();

    if (!symbol || !name || atomicNumber === 0) continue;

    const element: Element = {
      atomicNumber,
      symbol,
      name,
      atomicMass: parseFloat(row.atomic_mass || '0') || 0,
      category: getElementCategory(row.category || row.element_category || 'unknown'),
      group: parseInt(row.group || '0') || 0,
      period: parseInt(row.period || '0') || 0,
      block: getElementBlock(row.block || ''),
      electronConfiguration: row.electron_configuration || row.electron_configuration_semantic || '',
      appearance: row.appearance || '',
      electronegativity: parseElectronegativity(row.electronegativity_pauling || ''),
      atomicRadius: parseAtomicRadius(row.atomic_radius || '', row.shells || ''),
      ionizationEnergy: row.ionization_energies || undefined,
      electronAffinity: parseElectronAffinity(row.electron_affinity || ''),
      meltingPoint: parseFloat(row.melt || '0') || undefined,
      boilingPoint: parseFloat(row.boil || '0') || undefined,
      density: parseFloat(row.density || '0') || undefined,
      discoveredBy: row.discovered_by || row.discoverer || '',
      discoveryYear: parseInt(row.discovery_year || '0') || undefined,
      description: row.summary || row.description || '',
      valenceElectrons: getValenceElectrons(row.electron_configuration || row.electron_configuration_semantic || ''),
      reactivity: getReactivity(row.category || row.element_category || ''),
      state: getElementState(row.phase || row.state || ''),
      color: parseHexColor(row['cpk-hex'] || row.color || '808080'),
      
      // Additional CSV fields
      molarHeat: parseFloat(row.molar_heat || '0') || undefined,
      namedBy: row.named_by || '',
      phase: row.phase || '',
      source: row.source || '',
      xpos: parseInt(row.xpos || '0') || undefined,
      ypos: parseInt(row.ypos || '0') || undefined,
      wxpos: parseInt(row.wxpos || '0') || undefined,
      wypos: parseInt(row.wypos || '0') || undefined,
      shells: row.shells || '',
      imageTitle: row['image.title'] || '',
      imageUrl: row['image.url'] || '',
    };

    elements.push(element);
  }

  // Sort by atomic number
  elements.sort((a, b) => a.atomicNumber - b.atomicNumber);

  return elements;
}

export async function loadElementsFromCSV(): Promise<Element[]> {
  try {
    const response = await fetch('/data/PeriodicTableCSV.csv');
    if (!response.ok) {
      console.error('Failed to fetch CSV:', response.statusText);
      return [];
    }
    const csvText = await response.text();
    return parseCSVData(csvText);
  } catch (error) {
    console.error('Error loading CSV:', error);
    return [];
  }
}
