
import { SuggestedBlend } from "../../types";

export const LOCAL_BLENDS: Record<string, SuggestedBlend[]> = {
    "Clássicos": [
        {
            name: "The ShackBlend (Shake Shack)",
            description: "O blend mais famoso de NY. Equilíbrio perfeito entre sabor e suculência.",
            fatRatio: 0.20,
            meats: [
                { name: "Acém", ratio: 0.50 },
                { name: "Peito", ratio: 0.25 },
                { name: "Costela", ratio: 0.25 }
            ],
            citations: [{ title: "Serious Eats", uri: "https://www.seriouseats.com/the-burger-lab-the-fake-shack-how-to-make-shake-shack-burger" }]
        },
        {
            name: "Pat LaFrieda Original",
            description: "O fornecedor das melhores hamburguerias dos EUA. Sabor intenso de carne maturada.",
            fatRatio: 0.25,
            meats: [
                { name: "Fraldinha", ratio: 0.50 },
                { name: "Costela", ratio: 0.25 },
                { name: "Peito", ratio: 0.25 }
            ]
        },
        {
            name: "Clássico 50/50",
            description: "Simples e infalível. O ponto de partida de toda hamburgueria artesanal.",
            fatRatio: 0.22,
            meats: [
                { name: "Acém", ratio: 0.50 },
                { name: "Peito", ratio: 0.50 }
            ]
        }
    ],
    "Famosos (Brasil/Mundo)": [
        {
            name: "Z Deli Style",
            description: "Inspirado na icônica hamburgueria de SP. Blend potente e gorduroso.",
            fatRatio: 0.25,
            meats: [
                { name: "Acém", ratio: 0.35 },
                { name: "Peito", ratio: 0.35 },
                { name: "Costela", ratio: 0.30 }
            ]
        },
        {
            name: "Madero Style",
            description: "Famoso pela maciez. O segredo é a fraldinha na composição.",
            fatRatio: 0.18,
            meats: [
                { name: "Fraldinha", ratio: 0.70 },
                { name: "Picanha", ratio: 0.15 },
                { name: "Contrafilé", ratio: 0.15 }
            ]
        },
        {
            name: "The Debetti Dry Aged",
            description: "Inspiração nas carnes maturadas a seco. Sabor intenso e amanteigado.",
            fatRatio: 0.20,
            meats: [
                { name: "Acém", ratio: 0.50 },
                { name: "Costela", ratio: 0.25 },
                { name: "Peito (Dry Aged)", ratio: 0.25 }
            ]
        },
        {
            name: "TT Burger Style",
            description: "O sabor do Rio. Blend do chef Thomas Troisgros.",
            fatRatio: 0.20,
            meats: [
                { name: "Acém", ratio: 0.33 },
                { name: "Fraldinha", ratio: 0.33 },
                { name: "Contrafilé", ratio: 0.33 }
            ]
        },
        {
            name: "Buzina Burgers",
            description: "Eleito melhor burger de SP. Blend complexo e saboroso.",
            fatRatio: 0.22,
            meats: [
                { name: "Peito", ratio: 0.40 },
                { name: "Acém", ratio: 0.40 },
                { name: "Costela", ratio: 0.20 }
            ]
        }
    ],
    "Smash": [
        {
            name: "Ultra Smash Onion",
            description: "Técnica de Oklahoma. Carne pressionada com cebola na chapa.",
            fatRatio: 0.25,
            meats: [
                { name: "Acém", ratio: 0.60 },
                { name: "Costela", ratio: 0.40 }
            ]
        },
        {
            name: "American Cheese",
            description: "O blend clássico de fast-food americano, feito para derreter na boca.",
            fatRatio: 0.20,
            meats: [
                { name: "Acém", ratio: 1.0 }
            ]
        }
    ],
    "Premium (Angus/Wagyu)": [
        {
            name: "Wagyu Experience",
            description: "Para carnes com alto marmoreio. Cuidado para não passar do ponto.",
            fatRatio: 0.28,
            meats: [
                { name: "Peito (Wagyu)", ratio: 0.50 },
                { name: "Acém (Angus)", ratio: 0.50 }
            ]
        },
        {
            name: "Picanha Blend",
            description: "O sabor preferido dos brasileiros. Use a capa de gordura na moagem.",
            fatRatio: 0.20,
            meats: [
                { name: "Picanha", ratio: 1.0 }
            ]
        }
    ],
    "Custo-Benefício": [
        {
            name: "Econômico Saboroso",
            description: "Cortes baratos que entregam muito sabor quando moídos juntos.",
            fatRatio: 0.20,
            meats: [
                { name: "Ponta de Agulha", ratio: 0.50 },
                { name: "Músculo", ratio: 0.50 }
            ]
        },
        {
            name: "Costela Pura",
            description: "Saboroso e barato. A costela janela tem gordura e sabor ideais.",
            fatRatio: 0.25,
            meats: [
                { name: "Costela", ratio: 1.0 }
            ]
        }
    ]
};
