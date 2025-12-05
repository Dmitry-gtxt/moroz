import { Search, Calendar, PartyPopper } from 'lucide-react';

const steps = [
  {
    icon: Search,
    title: 'Выберите исполнителя',
    description: 'Просмотрите каталог, отфильтруйте по району, дате, цене и рейтингу. Посмотрите видео-приветствия.',
  },
  {
    icon: Calendar,
    title: 'Забронируйте время',
    description: 'Выберите удобный день и время из календаря исполнителя. Внесите предоплату онлайн.',
  },
  {
    icon: PartyPopper,
    title: 'Встретьте праздник',
    description: 'Дед Мороз приедет к вам домой или в указанное место. Подарите детям волшебство!',
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 bg-gradient-frost">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Как это работает
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Три простых шага до незабываемого праздника
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="relative group"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-border" />
              )}
              
              <div className="relative bg-card rounded-2xl p-8 shadow-md hover:shadow-lg transition-shadow text-center">
                {/* Step number */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-accent text-white font-bold flex items-center justify-center text-sm">
                  {index + 1}
                </div>
                
                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-secondary flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                  <step.icon className="h-8 w-8 text-accent" />
                </div>
                
                <h3 className="font-display text-xl font-semibold mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
