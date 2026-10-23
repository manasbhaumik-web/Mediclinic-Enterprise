import { Star, HelpCircle, ChevronDown } from 'lucide-react';

interface FaqSectionProps {
  isBM: boolean;
  testimonials: { name: string; role: string; category: string; comment: string; rating: number; date: string; }[];
  faqs: { q: string; a: string; }[];
  openFaqIndex: number;
  toggleFaq: (index: number) => void;
}

export default function FaqSection({ isBM, testimonials, faqs, openFaqIndex, toggleFaq }: FaqSectionProps) {
  return (
    <section id="faq" className="py-20 px-4 lg:px-8 bg-surface border-t border-line-subtle">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Patient Reviews */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-accent">
              {isBM ? 'Maklum Balas Pesakit' : 'Patient Reviews'}
            </span>
            <h2 className="type-section-title-lg text-ink">
              {isBM ? 'Apa Kata Pesakit Kami' : 'What Our Patients Say'}
            </h2>
          </div>
    
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div key={idx} className="ice-mint-card p-5 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-muted italic leading-relaxed">
                    &ldquo;{t.comment}&rdquo;
                  </p>
                </div>
    
                <div className="pt-3 border-t border-line-subtle flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-ink">{t.name}</div>
                    <div className="text-xs text-accent">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
    
        {/* FAQ Accordion */}
        <div className="space-y-6 pt-6 border-t border-line-subtle">
          <div className="text-center space-y-2">
            <h2 className="type-section-title-lg text-ink">
              {isBM ? 'Soalan Lazim (FAQ)' : 'Frequently Asked Questions'}
            </h2>
          </div>
    
          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="ice-mint-card transition-all">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none min-h-[44px]"
                  >
                    <span className="text-xs font-bold text-ink flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-accent shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-accent' : ''}`} />
                  </button>
    
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-muted leading-relaxed border-t border-line-subtle pt-3 animate-fadeIn">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
    
      </div>
    </section>
  );
}
