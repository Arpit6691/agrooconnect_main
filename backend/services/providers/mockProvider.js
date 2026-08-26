const BaseProvider = require('./baseProvider');

/**
 * Mock AI Provider for offline development, automated testing, and fallback.
 */
class MockProvider extends BaseProvider {
  constructor() {
    super('mock');

    this.diseaseDatabase = [
      {
        cropName: 'Tomato',
        diseaseName: 'Early Blight',
        severity: 'Moderate',
        description: 'Early Blight (Alternaria solani) causes concentric dark brown spots with yellow halos on older lower leaves, eventually leading to premature defoliation.',
        possibleCauses: [
          'Fungal infection by Alternaria solani',
          'High relative humidity and warm temperatures (24-29°C)',
          'Rain splash spreading soil-borne spores onto lower leaves',
          'Overcrowded planting with poor aeration'
        ],
        recommendedTreatment: [
          'Prune and destroy infected lower foliage immediately',
          'Apply registered copper fungicide or chlorothalonil according to local agricultural guidelines',
          'Switch to drip irrigation to prevent wet leaf canopy',
          'Improve spacing between plants for optimal airflow'
        ],
        preventionTips: [
          'Rotate solanaceous crops on a 2-3 year cycle',
          'Mulch heavily beneath plants to eliminate soil splash',
          'Water plants early in the day at the root base',
          'Select certified disease-resistant tomato cultivars'
        ]
      },
      {
        cropName: 'Potato',
        diseaseName: 'Late Blight',
        severity: 'High',
        description: 'Late Blight (Phytophthora infestans) is an aggressive oomycete disease causing rapid, dark water-soaked leaf lesions, white fungal growth under humid conditions, and tuber rot.',
        possibleCauses: [
          'Pathogen Phytophthora infestans',
          'Cool, persistent wet weather (10-20°C with >90% humidity)',
          'Infected seed tubers or cull piles nearby',
          'Windblown sporangia from neighboring infected fields'
        ],
        recommendedTreatment: [
          'Urgently rogue and destroy infected vines to halt spore release',
          'Apply recommended systemic and protectant fungicides per local advisories',
          'Avoid handling wet foliage to limit mechanical spread',
          'Desiccate haulms prior to harvesting tubers'
        ],
        preventionTips: [
          'Use only certified disease-free seed potatoes',
          'Eliminate volunteer potato plants and cull piles',
          'Ensure well-drained field beds and proper hilling',
          'Track local blight forecasts and apply preventive treatments'
        ]
      },
      {
        cropName: 'Pepper / Chilli',
        diseaseName: 'Bacterial Blight',
        severity: 'High',
        description: 'Bacterial Blight (Xanthomonas campestris) causes water-soaked, dark angular lesions on leaves that turn brown with yellow borders, causing severe leaf drop.',
        possibleCauses: [
          'Bacterial pathogen Xanthomonas species',
          'Warm, humid weather with frequent rainfall or overhead sprinkling',
          'Infected seeds or contaminated transplants',
          'Bacteria entering through natural stomata or wound sites'
        ],
        recommendedTreatment: [
          'Remove severely infected plants to reduce inoculum',
          'Apply copper-based bactericides combined with mancozeb as recommended locally',
          'Avoid overhead sprinkler irrigation',
          'Sanitize farm tools between crop rows'
        ],
        preventionTips: [
          'Sow only hot-water treated or certified disease-free seeds',
          'Implement 2-year crop rotation avoiding other solanaceous crops',
          'Avoid working in the field when foliage is wet',
          'Maintain balanced soil potassium and nitrogen levels'
        ]
      },
      {
        cropName: 'Cotton / Groundnut',
        diseaseName: 'Cercospora Leaf Spot',
        severity: 'Moderate',
        description: 'Cercospora Leaf Spot causes circular to oval brown lesions with distinct gray centers and reddish-brown margins, leading to premature leaf shedding.',
        possibleCauses: [
          'Fungal pathogen Cercospora species',
          'Warm temperatures and extended periods of high leaf wetness',
          'Crop debris harboring overwintering spores',
          'Nutrient stress, especially potassium deficiency'
        ],
        recommendedTreatment: [
          'Apply approved foliar fungicides (triazoles or strobilurins) per agricultural schedule',
          'Remove infected residue after harvest',
          'Maintain balanced soil nutrients to reduce plant stress',
          'Ensure adequate plant spacing'
        ],
        preventionTips: [
          'Rotate with non-host crops like cereals or grasses',
          'Deep plow crop residue post-harvest',
          'Maintain optimal plant density for sunlight penetration',
          'Use resistant seed varieties where available'
        ]
      },
      {
        cropName: 'Apple / Mango',
        diseaseName: 'Anthracnose',
        severity: 'Moderate',
        description: 'Anthracnose (Colletotrichum species) produces sunken, dark necrotic lesions on leaves, stems, and fruits, often with salmon-colored spore masses in humid conditions.',
        possibleCauses: [
          'Fungal pathogen Colletotrichum gloeosporioides',
          'Warm, rainy weather and overhead wetting',
          'Infected twigs and fallen foliage left in the orchard/field',
          'Wound points from insects or weather damage'
        ],
        recommendedTreatment: [
          'Prune dead or cankered twigs and burn infected debris',
          'Apply copper or captan fungicides during early growth and flushes',
          'Improve canopy aeration through careful pruning',
          'Protect fruits during early development'
        ],
        preventionTips: [
          'Choose tolerant or resistant cultivars',
          'Maintain orchard hygiene and clear leaf litter',
          'Apply organic mulch and ensure good soil drainage',
          'Avoid sprinkler irrigation that wets tree canopies'
        ]
      },
      {
        cropName: 'Cucurbits (Cucumber / Melon)',
        diseaseName: 'Powdery Mildew',
        severity: 'Low',
        description: 'Powdery Mildew (Podosphaera / Erysiphe species) appears as white powdery talc-like fungal patches on the upper surface of leaves, reducing photosynthesis.',
        possibleCauses: [
          'Airborne fungal spores of powdery mildew species',
          'Warm, dry days paired with humid, dew-heavy nights',
          'Dense shade and restricted airflow in the canopy',
          'Excess nitrogen promoting lush, susceptible new foliage'
        ],
        recommendedTreatment: [
          'Spray with potassium bicarbonate, horticultural oils, or sulfur fungicides',
          'Prune dense canopy to increase light penetration and airflow',
          'Remove heavily colonized older leaves',
          'Avoid excess nitrogen fertilizer'
        ],
        preventionTips: [
          'Plant powdery-mildew resistant hybrid varieties',
          'Select full-sun planting locations',
          'Ensure wide spacing between vines',
          'Apply preventive biological fungicides (Bacillus subtilis)'
        ]
      },
      {
        cropName: 'Wheat / Barley',
        diseaseName: 'Rust',
        severity: 'Moderate',
        description: 'Rust (Puccinia species) causes raised, reddish-orange powdery pustules on leaf blades and sheaths, causing rapid moisture loss and grain yield reduction.',
        possibleCauses: [
          'Airborne urediniospores of Puccinia triticina / graminis',
          'Moderate temperatures (15-22°C) with frequent dew formation',
          'Presence of susceptible cereal host varieties',
          'Green bridge (volunteer cereals and wild grasses)'
        ],
        recommendedTreatment: [
          'Apply targeted triazole fungicides (propiconazole / tebuconazole) at early flag leaf stage',
          'Monitor disease severity thresholds before full flowering',
          'Destroy volunteer cereal plants harboring rust spores',
          'Ensure balanced fertilizer application'
        ],
        preventionTips: [
          'Sow rust-resistant cereal cultivars',
          'Avoid very early sowing that prolongs infection window',
          'Conduct regular weekly field scouting during vegetative growth',
          'Practice field sanitation between crop cycles'
        ]
      },
      {
        cropName: 'Papaya / Tobacco / Tomato',
        diseaseName: 'Leaf Mosaic',
        severity: 'High',
        description: 'Leaf Mosaic Virus causes distinct mottled light and dark green mosaic patterns on leaves, accompanied by leaf curling, blistering, and stunted growth.',
        possibleCauses: [
          'Plant viral pathogen (Tobacco Mosaic Virus / Cucumber Mosaic Virus)',
          'Insect vectors such as aphids and whiteflies',
          'Mechanical transmission through pruning tools and worker hands',
          'Infected seed or vegetative propagation material'
        ],
        recommendedTreatment: [
          'Promptly rogue and safely destroy infected plants (do not compost)',
          'Control insect vectors using insecticidal soaps or neem formulations',
          'Sanitize tools with a 10% bleach solution between plants',
          'Wash hands thoroughly before handling healthy plants'
        ],
        preventionTips: [
          'Use virus-free certified seeds and nursery stock',
          'Erect yellow sticky traps and insect barrier netting',
          'Control surrounding weed hosts that harbor aphids',
          'Wash tools in disinfectant between pruning tasks'
        ]
      },
      {
        cropName: 'Cabbage / Brassicas',
        diseaseName: 'Alternaria Leaf Spot',
        severity: 'Moderate',
        description: 'Alternaria Leaf Spot causes circular brown lesions with target-like rings and chlorotic halos on brassica leaves, rendering leaves unmarketable.',
        possibleCauses: [
          'Fungal pathogen Alternaria brassicicola',
          'Warm, moist conditions with lingering leaf wetness',
          'Infected crop residue or contaminated seed lots',
          'Nutrient deficiency predisposing older leaves'
        ],
        recommendedTreatment: [
          'Apply approved protectant fungicides during vegetative development',
          'Remove and burn infected leaves from lower stems',
          'Avoid overhead sprinkler watering',
          'Incorporate balanced potassium fertilizer'
        ],
        preventionTips: [
          'Use hot-water treated disease-free seeds',
          'Rotate with non-cruciferous crops for at least 3 years',
          'Incorporate crop residues deeply into the soil after harvest',
          'Provide adequate row spacing'
        ]
      }
    ];

    this.healthyResponses = [
      {
        cropName: 'Tomato',
        message: 'No significant disease detected. Foliage displays healthy green coloration, normal turgidity, and robust leaf structure.',
        recommendations: [
          'Maintain regular soil moisture monitoring and drip irrigation',
          'Apply balanced organic compost and micronutrient spray',
          'Conduct weekly field scouting for early pest or disease symptoms',
          'Keep lower foliage pruned 15cm off the soil bed'
        ]
      },
      {
        cropName: 'Corn (Maize)',
        message: 'No pathological symptoms detected. Leaf tissue is uniform and vigorous with strong leaf architecture.',
        recommendations: [
          'Maintain side-dressing nitrogen at critical growth stages',
          'Scout for fall armyworm or corn borer egg masses',
          'Ensure optimal weed management around root zones',
          'Monitor soil moisture during silking and tasseling'
        ]
      },
      {
        cropName: 'Rice',
        message: 'Rice canopy appears healthy and uniform without signs of fungal or bacterial lesions.',
        recommendations: [
          'Maintain optimal field water depth based on growth stage',
          'Apply split nitrogen doses to avoid luxury consumption',
          'Inspect leaf collars for blast lesions periodically',
          'Ensure clean bunds to minimize rodent and weed harborages'
        ]
      }
    ];
  }

  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  async analyzePlantImage(imageInfo) {
    const filename = imageInfo.filename || 'sample.jpg';
    const hash = this._simpleHash(filename);

    // Simulate realistic AI network latency (400-900ms)
    const delay = 400 + (hash % 500);
    await new Promise(resolve => setTimeout(resolve, delay));

    // ~25% chance healthy
    const isHealthy = (hash % 4) === 0;

    if (isHealthy) {
      const h = this.healthyResponses[hash % this.healthyResponses.length];
      const confidence = 88 + (hash % 11); // 88-98%
      return {
        cropName: h.cropName,
        diseaseName: null,
        status: 'Healthy',
        confidence,
        severity: 'None',
        description: 'Plant foliage appears completely healthy with no detectable signs of fungal, bacterial, or viral disease.',
        possibleCauses: [],
        recommendedTreatment: [],
        preventionTips: [],
        recommendations: h.recommendations,
        message: h.message
      };
    }

    // Select disease from database
    const d = this.diseaseDatabase[hash % this.diseaseDatabase.length];
    const confidence = 65 + (hash % 33); // 65-97%

    return {
      cropName: d.cropName,
      diseaseName: d.diseaseName,
      status: 'Diseased',
      confidence,
      severity: d.severity,
      description: d.description,
      possibleCauses: d.possibleCauses,
      recommendedTreatment: d.recommendedTreatment,
      preventionTips: d.preventionTips,
      recommendations: [
        'Isolate severely affected plant areas to minimize spore dispersal',
        'Verify diagnosis with a local agricultural extension officer prior to commercial pesticide application'
      ],
      message: null
    };
  }
}

module.exports = MockProvider;
