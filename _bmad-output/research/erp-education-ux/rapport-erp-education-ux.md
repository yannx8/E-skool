# ERP éducation Cameroun : références UX, analyse clast.io et recommandations

Recherche menée le 29 octobre 2026 dans Chrome (sessions de l'utilisateur) et par recherche web. Captures dans le dossier `captures/` (34 fichiers PNG).

Convention de lecture : **[Observé]** = vu de mes yeux sur la page citée. **[Déduit]** = mon interprétation ou recommandation. **Non vérifié** = je n'ai pas pu le constater.

---

## 1. Résumé et recommandations principales

1. **clast.io est un "tout-en-un" large et orienté IA** (18+ modules, 11 rôles, multi-branches, tuteur IA, GPS transport) vendu en USD, environ 80 à 150 USD par mois et par branche selon l'effectif [Observé]. Je n'ai vu **ni moratoire, ni échéancier négocié, ni Mobile Money, ni FCFA, ni interface française** sur ses pages [Observé : absence sur les pages lues ; leur produit réel reste non vérifié].
2. **Votre angle d'attaque le plus net : le recouvrement des pensions** (tranches, moratoires, relances WhatsApp, encaissement MoMo/OM/espèces avec reçu). C'est le seul problème dont la douleur se mesure en FCFA pour le directeur.
3. Les meilleures références ne sont pas scolaires : **Square** (échéancier d'acompte et de solde, reçus), **Lemon Squeezy** (séquence de relances), **Kitchen.co** (envoi par canal), **Mercury** (KPI impayés + onglet "à approuver"), **Aboard** (congés avec statut). Les dashboards scolaires de Dribbble sont des concepts denses et décoratifs.
4. **Pattern central à reprendre** : une fiche "compte élève" (ledger) avec solde, échéances, paiements, ajustements et historique, sur laquelle se branchent encaissement, moratoire et relance.
5. **Le moratoire doit être un objet métier à part entière** (demande, validation, nouvel échéancier, suivi, rupture), pas une note sur une facture. Aucun produit vu ne le fait pour l'école.
6. **MVP primaire (7 fonctions)** : élèves et classes, plan de frais par tranches, encaissement + reçu partageable, liste élèves avec solde, moratoires avec validation, relances WhatsApp/SMS groupées, tableau de bord directeur. **Couper** : paie, inventaire, bulletins, app native, IA, biométrie.
7. **Architecture** : noyau commun (personne, inscription, structure académique paramétrable, compte financier, paiements, moratoires, notifications, rôles) + modules activables (bulletins primaire/secondaire FR/EN, crédits/UE, sessions de formation).
8. **Ordre d'extension recommandé** : primaire, puis secondaire (même acheteur, mêmes mécaniques de frais, ticket plus élevé), puis centres de formation, puis université.
9. **Limites** : Mobbin inaccessible (plan gratuit), Behance non consulté, démo clast.io fermée (contact commercial). Voir annexe.

---

## 2. Analyse de clast.io

Sources : [clast.io](https://clast.io/), [/product](https://clast.io/product), [/for-schools](https://clast.io/for-schools), [/pricing](https://clast.io/pricing), [/live-demo](https://clast.io/live-demo), [/about](https://clast.io/about). Captures : `00_clast_home.png`, `00_clast_finance-overview-mockup.png`.

### Ce que le produit dit faire [Observé]

- **Positionnement** : "A Unified Operating System for Schools", ERP + SIS + LMS dans une seule base de données, "AI-Powered ERP". Cible : écoles K-12, collèges, universités, instituts de formation et de langues. Slogan école : "Stop managing your school with spreadsheets and WhatsApp groups".
- **Chiffres affichés** : 18+ modules, 11 rôles utilisateurs, une base partagée, branches illimitées. Rôles listés : Super Admin, Branch Manager, Academic Coordinator, Finance Manager, HR Manager, Grant Manager, Receptionist, Admission Officer, Librarian, Teacher, Student, Parents, General Staff.
- **Modules** :
  - Académique et LMS : curriculum, syllabus, plans de cours générés par IA, barèmes de notes personnalisés, bulletins générés automatiquement, examens, GPA et crédits pour le supérieur, "configurable per institution type".
  - Admissions et SIS : pipeline Kanban (walk-in, web, WhatsApp), identifiant permanent "Clast ID", réinscriptions et transferts.
  - Présences : 6 méthodes (biométrie ZKTeco, reconnaissance faciale, QR, NFC, appel, kiosque), mode hors ligne avec synchronisation, notification parent.
  - Finance et paie : factures par cohorte ou élève, paiement en ligne via Stripe, PayPal et "local gateways", reçus automatiques, relances d'impayés planifiées par WhatsApp et email, bourses, remises fratrie et exonérations avec circuit d'approbation, piste d'audit, dépenses et budgets, paie calculée depuis les heures de présence.
  - Communication : canaux staff, système de tickets pour les parents (au lieu de messagerie libre), annonces avec accusés de lecture.
  - RH : onboarding digital, congés avec vérification des conflits d'emploi du temps, évaluations, tableau de tâches.
  - Opérations : transport avec GPS en direct, bibliothèque, actifs et inventaire avec "approval-based issue flows" et alertes de stock bas, tout cloisonné par branche.
  - IA : tuteur vocal pour élèves, détection des élèves à risque, génération d'évaluations, aide à la rédaction.
- **Mise en route** : "3 à 7 jours", migration de données incluse, pas d'engagement long.

### Tarification [Observé sur le calculateur, type "School", facturation annuelle]

| Élèves par branche | Prix affiché |
|---|---|
| 100 | 0 USD / mois (affichage tel quel, signification non vérifiée : palier gratuit ou bug) |
| 300 | 80 USD / mois |
| 500 | 96 USD / mois |
| 1000 | 120 USD / mois (150 USD en mensuel) |

Essai gratuit de 7 jours, "all modules included", tarif **par branche**. [Déduit] À environ 600 FCFA pour 1 USD (taux approximatif, à vérifier), 300 élèves reviennent à environ 48 000 FCFA par mois, soit environ 580 000 FCFA par an.

### Ce que je n'ai pas pu voir

- **Démo** : la page "Live demo" renvoie vers "Contact Sales", pas d'accès au produit. Toutes les "captures" produit du site sont des maquettes marketing (ex. `00_clast_finance-overview-mockup.png` : 87% collecté, 18,2k USD en attente, taux par niveau).
- **Origine de l'entreprise** : la page About n'a affiché qu'un profil (un product designer basé à Jakarta). Siège et marchés réels : non vérifiés.
- **Langues de l'interface** : non vérifié (site en anglais uniquement sur les pages lues).

### Forces apparentes [Déduit]

- Couverture fonctionnelle très large et cohérente (une base, un modèle de permissions, cloisonnement par branche dès l'architecture).
- Bonnes intuitions produit : tickets parents au lieu de WhatsApp libre, relances d'impayés automatisées, approbation sur les remises, audit sur chaque transaction.
- Discours multi-types d'établissements assumé (4 types au calculateur de prix).

### Faiblesses apparentes et angles ouverts [Déduit, sauf mention]

- **Paiement pensé carte et passerelles occidentales** (Stripe, PayPal) [Observé]. Mobile Money non mentionné [Observé : absent des pages lues].
- **Pas de moratoire ni d'échéancier négocié visible** [Observé : absent des pages lues]. C'est pourtant le quotidien du comptable d'une école privée camerounaise.
- **Prix en USD, par branche**, pensé pour des écoles qui achètent du logiciel. Une école primaire à Douala compare à un cahier et Excel.
- **Proposition de valeur très IA** (tuteur vocal, détection d'émotions) : peu prioritaire pour un directeur de primaire qui veut d'abord encaisser.
- **Largeur = risque de profondeur faible** sur chaque module (à vérifier en démo, non vérifié).
- **Spécificités Cameroun non adressées** sur les pages vues : sous-systèmes francophone et anglophone, bulletins locaux, tranches de pension, FCFA, SMS local.

---
## 3. Références par écran critique

Fiabilité des sources : **Refero = produit réel en production** (captures de vrais comptes, poids fort). **Dribbble / Pinterest = concept ou source non vérifiée** (poids faible, signalé dans chaque verdict).

Toutes les descriptions "Ce qu'on voit" sont [Observé] sur la capture. Les rubriques "Fonctionnalités supposées", "Pourquoi ça marche" et "Limites" sont [Déduit].

### Écran 1. Liste des élèves avec solde et statut de paiement

| Nom | Site | URL | Capture | Description | Verdict |
|---|---|---|---|---|---|
| Mercury Bill Pay | Refero | [lien](https://refero.design/pages/82b4731f-3cf9-4790-9b3f-671b7d875fba) | `01_refero_mercury-billpay-overdue.png` | 3 KPI (total dû, en retard, à échoir 7 j) au-dessus d'une table filtrée par onglets de statut | À reprendre (produit réel) |
| PayPal Invoicing | Refero | [lien](https://refero.design/pages/65172468-3bd7-4f5a-b1ef-039631a628ff) | `01_refero_paypal-invoicing-table.png` | Table de factures, recherche, filtre, export, sélection multiple avec actions groupées | À reprendre (produit réel) |
| PayPal filtres | Refero | [lien](https://refero.design/pages/e348104b-fd61-4f3a-8883-2f44981ea341) | `01_refero_paypal-invoicing-filters-sheet.png` | Panneau latéral de filtres (statut payé/impayé, dates, montant) + puces "Filtré par" | À adapter (produit réel) |
| Teachable Students | Refero | [lien](https://refero.design/pages/bfec5414-633e-4a7f-b53d-d6eb7563c1f7) | `01_refero_teachable-students-list.png` | Liste d'élèves : Export CSV, envoyer un email, ajouter, filtres sauvegardés | À adapter (produit réel) |

**Mercury Bill Pay**
- Ce qu'on voit : titre, 3 cartes KPI (6 factures pour 17 272 USD au total, 3 en retard pour 13 110 USD en orange, 0 à échoir sous 7 jours), onglets Inbox / Needs Approval / Scheduled / Paid avec compteurs, filtre Status, table (échéance, badge "Overdue", bénéficiaire, montant, n° facture, mise à jour).
- UX : un coup d'oeil donne "combien" et "combien en retard", un clic sur un onglet filtre la table. Actions principales en haut à droite (envoyer, téléverser).
- Fonctionnalités supposées : agrégats en temps réel par statut, calcul d'échéance, file "à approuver" alimentée par un circuit de validation.
- Pourquoi ça marche : les KPI sont aussi des filtres mentaux, le rouge/orange est réservé au retard, la table reste sobre.
- Limites Afrique : à transposer en FCFA sans décimales, grouper par classe (le directeur pense "CM2", pas "bénéficiaire").
- Verdict : **à reprendre** comme structure de la page "Pensions" (KPI : attendu, encaissé, en retard, sous moratoire ; onglets : tous / en retard / sous moratoire / soldés). Produit réel.

**PayPal Invoicing (table)**
- Ce qu'on voit : onglets Invoices / Estimates / Recurring series, grande barre de recherche "toutes factures et clients", boutons filtre et export, case "1 selected" qui fait apparaître Print et Archive, colonnes client, n°, date, échéance, statut (badge Draft), vue, montant.
- UX : actions groupées contextuelles qui n'apparaissent qu'après sélection : moins de bruit visuel.
- Fonctionnalités supposées : recherche plein texte, export CSV/PDF, impression par lot.
- Pourquoi ça marche : la recherche unique évite de choisir un champ, l'action groupée sert la relance en masse.
- Limites : colonnes orientées facture, pas élève. Il faut une colonne "solde restant" et "prochaine échéance".
- Verdict : **à reprendre** le pattern sélection + actions groupées (Relancer, Imprimer reçus, Exporter). Produit réel.

**PayPal Invoicing (panneau de filtres)**
- Ce qu'on voit : panneau latéral droit "Filters" : recherche par champ, statut de paiement (All / Unpaid / Paid), statut de facture, type et plage de date, montant et devise, boutons "Clear filters" et "Apply filters". Derrière : "2 results for liam" et une puce "Creation date: Past 180 days" supprimable.
- UX : filtres riches sans encombrer la table, résumé visible des filtres actifs.
- Fonctionnalités supposées : filtres combinables, sauvegarde implicite de la requête.
- Pourquoi ça marche : la puce "Filtré par" évite qu'un comptable croie voir toute l'école alors qu'il voit un filtre.
- Limites : trop de champs pour une école primaire. Garder : classe, statut (à jour / en retard / moratoire / soldé), tranche, montant restant.
- Verdict : **à adapter**. Produit réel.

**Teachable Students**
- Ce qu'on voit : liste "Students" avec boutons Export CSV, Email Students, Add Students, "Add Filter", recherche, "Saved Filters", table (nom, email, dernier login, inscription, achats), quota "3 / 1000 students" et lien Upgrade, toast d'import.
- UX : l'import et l'export sont des actions de premier niveau, ce qui compte en rentrée scolaire.
- Fonctionnalités supposées : import CSV en tâche de fond, filtres sauvegardés, quotas par plan.
- Pourquoi ça marche : "Saved Filters" = vues métier réutilisables ("CM2 en retard").
- Limites : pas de notion de solde. Le quota d'élèves visible est un bon levier de pricing par paliers.
- Verdict : **à adapter** (import, filtres sauvegardés, quota de plan). Produit réel.

### Écran 2. Encaissement d'une pension (saisie, reçu)

| Nom | Site | URL | Capture | Description | Verdict |
|---|---|---|---|---|---|
| Square "Payment recorded" | Refero | [lien](https://refero.design/pages/37d87de4-55ad-4cf9-a7ec-06198eca054c) | `02_refero_square-payment-recorded.png` | Confirmation d'encaissement avec 3 actions : nouvelle vente, envoyer reçu, imprimer reçu | À reprendre (produit réel) |
| Square reçu | Refero | [lien](https://refero.design/pages/9d861019-5ea2-46b3-b60f-d8bd4422f09f) | `02_refero_square-receipt.png` | Reçu compact type ticket : en-tête marchand, lignes, remise, total, n° de reçu | À reprendre (produit réel) |
| Stripe facture + historique | Refero | [lien](https://refero.design/pages/b176825e-b144-431f-aa4f-8dcf47104c65) | `02_refero_stripe-invoice-detail-timeline.png` | Détail de facture : montant, statut, actions, chronologie des événements, PDF | À adapter (produit réel) |
| GoFundMe reçu modal | Refero | [lien](https://refero.design/pages/ff65cf95-ba0a-4f1f-acb3-ba51266c7ddb) | `02_refero_gofundme-receipt-modal.png` | Modal reçu : "envoyé par email à...", moyen de paiement, total payé aujourd'hui | À adapter (produit réel) |
| Facturation HIMS | Pinterest | [lien](https://www.pinterest.com/pin/1151866042220781026/) | `02_pinterest_hims-billing-quick-payment.png` | Compte patient : solde dû, onglets charges/paiements/ajustements/historique, saisie rapide de paiement | À adapter (source non vérifiée) |

**Square "Payment recorded"**
- Ce qu'on voit : montant en en-tête, coche verte "Payment recorded", bouton principal "New sale", secondaires "Send receipt" et "Print receipt", lien vers l'historique.
- UX : 1 écran de confirmation, l'action suivante la plus probable (encaisser le parent suivant) est mise en avant.
- Fonctionnalités supposées : génération de reçu numéroté, envoi par canal, impression, historique.
- Pourquoi ça marche : vitesse au guichet, zéro ambiguïté sur le fait que l'argent est enregistré.
- Limites : remplacer "Send receipt" par "Envoyer sur WhatsApp" et "SMS". Ajouter "Imprimer (ticket 58/80 mm)".
- Verdict : **à reprendre** tel quel en logique. Produit réel.

**Square reçu**
- Ce qu'on voit : logo, nom et adresse, date et heure, ligne "Custom Amount", prix barré et remise, sous-total, taxes, total, identifiant de reçu.
- Fonctionnalités supposées : numérotation unique, remise tracée, format imprimable.
- Pourquoi ça marche : lisible en 3 secondes, crédible.
- Limites : pour l'école ajouter élève, classe, année scolaire, tranche réglée, **solde restant après paiement**, moyen (espèces / MTN MoMo / Orange Money + référence de transaction), caissier, cachet. C'est le reçu qui crée la confiance du parent.
- Verdict : **à reprendre** la compacité, **adapter** le contenu. Produit réel.

**Stripe détail de facture**
- Ce qu'on voit : n° de facture, montant, badge "Open", "Due next week", actions Add note / Edit invoice / Send invoice / Charge customer / More, chronologie (facture finalisée, page de paiement créée, prélèvement auto activé avec dates), résumé (facturé à, devise, échéance, méthode), bouton "Invoice PDF", lignes.
- UX : actions en haut, preuve (chronologie) au milieu, détail en bas.
- Fonctionnalités supposées : journal d'événements horodatés par objet, notes internes.
- Pourquoi ça marche : la chronologie répond à "qui a fait quoi, quand", utile en cas de litige parent.
- Limites : densité anglo-saxonne, à simplifier. La chronologie est à reprendre pour le compte élève et le moratoire.
- Verdict : **à adapter**. Produit réel.

**GoFundMe reçu modal**
- Ce qu'on voit : modal "Receipt", phrase "ce reçu a été envoyé à [email]", moyen de paiement (carte ...4400), montant, pourboire, "Total paid today".
- Pourquoi ça marche : confirme le canal d'envoi, rassure.
- Limites : dépend de l'email, peu utilisé par les parents. Remplacer par numéro WhatsApp.
- Verdict : **à adapter** (phrase de confirmation du canal). Produit réel.

**Facturation HIMS (Pinterest)**
- Ce qu'on voit : écran hospitalier "Billing Update" : en-tête patient, carte "Balance due", onglets Itemized Charges / Payments / Adjustments / Payment History, panneau "Billing overview" (charges, paiements, remises, solde), formulaire "Add new charge", bloc "Payment quick entry" (méthode, montant, n° OR/référence, bouton Record payment), tableau récapitulatif des paiements (n° OR, méthode, montant, reçu par).
- UX : tout le compte sur un écran, saisie de paiement sans changer de page.
- Fonctionnalités supposées : ledger par compte, référence de reçu officiel, traçabilité de l'encaisseur.
- Pourquoi ça marche : c'est exactement le modèle "compte élève" : charges (tranches), paiements, ajustements (remises, moratoires).
- Limites : très dense, visuel daté. Source non vérifiée (épingle d'un utilisateur, produit réel ou concept inconnu).
- Verdict : **à adapter** la structure, pas le visuel. Fiabilité faible.

### Écran 3. Demande et validation d'un moratoire

| Nom | Site | URL | Capture | Description | Verdict |
|---|---|---|---|---|---|
| Square éditeur d'échéancier | Refero | [lien](https://refero.design/pages/e02168d9-b6af-4fb5-9213-d102c57738e4) | `03_refero_square-payment-schedule-editor.png` | Acompte + découpage du solde en paiements datés, relances par échéance | À reprendre (produit réel) |
| Square échéancier côté client | Refero | [lien](https://refero.design/pages/df96828b-e340-4d10-96fd-2945b478e54c) | `03_refero_square-payment-schedule-client.png` | Liste des échéances avec date et statut, total payé, reste dû | À reprendre (produit réel) |
| Asana approbation | Refero | [lien](https://refero.design/pages/b163b5b5-fbb5-49e9-9a1b-786f51252b70) | `03_refero_asana-approval-task.png` | Tâche d'approbation : Approuver / Demander des modifications / Rejeter + commentaires | À adapter (produit réel) |

**Square éditeur d'échéancier**
- Ce qu'on voit : modal "Payment schedule", section "Deposit request" avec bascule Pourcentage / Montant, table (montant, nom, échéance "Due today", relances "4 reminders"), section "Balance split" avec Payment 1 (dans 30 jours), Payment 2 (dans 60 jours), relances par paiement, lien "Add another payment", phrase de synthèse ("Request 0% of 415 USD invoice balance over 2 payments").
- UX : 1 écran, édition en ligne, phrase de synthèse qui reformule le plan.
- Fonctionnalités supposées : calcul automatique des montants par % ou valeur, contrôle que la somme = solde, relances attachées à chaque échéance.
- Pourquoi ça marche : la phrase de synthèse réduit les erreurs (le comptable relit en français ce qu'il a saisi).
- Limites : pas de circuit de validation, pas de motif. Pour l'école : motif, justificatif, plafonds, validateur.
- Verdict : **à reprendre** comme écran "Proposer un échéancier" du moratoire. Produit réel.

**Square échéancier côté client**
- Ce qu'on voit : sous la facture, bloc "Payment schedule" : Deposit, Payment 1, Payment 2 avec date et "Unpaid", puis "Total paid" et "Remaining balance".
- Pourquoi ça marche : le parent voit ce qu'il doit et quand, sans jargon.
- Verdict : **à reprendre** pour la vue parent du moratoire et le reçu. Produit réel.

**Asana approbation**
- Ce qu'on voit : boutons "Approve", "Request changes", "Rejected" en haut, titre, assigné, date d'échéance, champs de statut et priorité, description, fil de commentaires, collaborateurs.
- UX : 3 décisions explicites, la contre-proposition est une décision à part entière.
- Fonctionnalités supposées : workflow d'approbation, notifications, historique des décisions.
- Pourquoi ça marche : "Demander des modifications" correspond au cas réel "le directeur accepte mais en 3 tranches au lieu de 4".
- Limites : générique. Il faut afficher à côté le solde, l'historique de paiement de la famille et les moratoires précédents.
- Verdict : **à adapter**. Produit réel.

### Écran 4. Relance des parents en retard

| Nom | Site | URL | Capture | Description | Verdict |
|---|---|---|---|---|---|
| Kitchen.co envoi | Refero | [lien](https://refero.design/pages/cfdace14-cce2-4bb8-a1bc-d209814db2c0) | `04_refero_kitchen-send-invoice-channels.png` | Modal d'envoi par canal (Conversation / Email / Page de paiement), message éditable avec lien | À reprendre (produit réel) |
| Lemon Squeezy relances | Refero | [lien](https://refero.design/pages/20af7612-c8ee-476c-bbff-a4251a23c874) | `04_refero_lemonsqueezy-dunning-sequence.png` | Séquence de 5 relances avec jour d'envoi et action finale après N jours | À reprendre (produit réel) |
| PayPal relances auto | Refero | [lien](https://refero.design/pages/c32b0b20-9587-40bc-a2ad-5fb7d4272adc) | `04_refero_paypal-auto-reminders.png` | Interrupteurs "avant échéance" et "après échéance" | À reprendre (produit réel, capture un peu floue) |
| Stripe envoi + aperçu | Refero | [lien](https://refero.design/pages/fd39bdae-f76e-4643-bba7-0593136abdb5) | `04_refero_stripe-send-invoice-confirm.png` | Confirmation d'envoi + aperçu en direct de ce que reçoit le client | À adapter (produit réel) |
| Square page de demande | Refero | [lien](https://refero.design/pages/1c27a14d-2c42-4db0-a548-c0f53bcf2114) | `04_refero_square-payment-request-page.png` | Page reçue par le client : "X vous demande un paiement de...", date, détail | À reprendre (produit réel) |

**Kitchen.co envoi**
- Ce qu'on voit : modal "Send Invoice", onglets "Send via" Conversation / Email / Payment page, destinataire coché, Cc, objet, message pré-rempli avec lien de paiement, mention "le PDF sera joint automatiquement", facture en aperçu derrière.
- UX : choix du canal en premier, message modifiable, 1 clic pour envoyer.
- Pourquoi ça marche : se transpose directement en onglets WhatsApp / SMS / Lien.
- Limites : à faire en masse (sélection de 40 parents) et avec variables (nom de l'enfant, classe, montant, date).
- Verdict : **à reprendre**. Produit réel.

**Lemon Squeezy relances**
- Ce qu'on voit : "Dunning" activé, "After 60 days" + action ("cancel the subscription"), "Customer reminders : send up to 5", liste de messages avec leur objet et "Sent on day 4 / 8 / 15 / 21".
- Fonctionnalités supposées : planificateur, modèles de messages, action automatique en fin de séquence.
- Pourquoi ça marche : la relance devient un réglage unique, plus une corvée hebdomadaire.
- Limites : l'action finale "annuler" n'a pas de sens à l'école. Remplacer par "alerte directeur" ou "convocation". Ton à adapter (pas de menace).
- Verdict : **à reprendre** (séquence J-3, J+1, J+7, J+15 par tranche). Produit réel.

**PayPal relances auto**
- Ce qu'on voit : onglet "Auto reminders" dans les réglages de facturation, deux cartes avec interrupteur et crayon : avant échéance, après échéance, et "Notify me about unopened invoices".
- Verdict : **à reprendre** pour la V1 (plus simple que Lemon Squeezy). Produit réel, capture légèrement floue.

**Stripe envoi + aperçu**
- Ce qu'on voit : bandeau mode test, modal "Send invoice" (destinataire, Cc, avertissement "non modifiable après paiement"), boutons Continuer / Envoyer, à droite aperçu de la page de paiement avec "Pay this invoice".
- Pourquoi ça marche : l'aperçu montre ce que le parent verra, ce qui évite les erreurs de montant.
- Verdict : **à adapter** (aperçu du message WhatsApp avant envoi groupé). Produit réel.

**Square page de demande**
- Ce qu'on voit : "Refero has requested a payment of 49,80 USD", "Deposit due November 7", message, carte client, détail de la facture.
- Pourquoi ça marche : phrase humaine, montant et date d'abord.
- Limites : le parent arrive depuis WhatsApp, sur mobile, parfois en 3G : page légère, sans connexion obligatoire.
- Verdict : **à reprendre** comme page d'atterrissage du lien envoyé en relance. Produit réel.

### Écran 5. Tableau de bord du directeur

| Nom | Site | URL | Capture | Description | Verdict |
|---|---|---|---|---|---|
| GlossGenius Analytics | Refero | [lien](https://refero.design/pages/4064fa00-4e9e-48e2-a487-14ee88b64e65) | `05_refero_glossgenius-analytics.png` | KPI héros avec barre de composition + revenus projetés | À adapter (produit réel) |
| Lemon Squeezy grille KPI | Refero | [lien](https://refero.design/pages/16d1663f-9117-46d7-b59c-e634c537d8a4) | `05_refero_lemonsqueezy-kpi-grid.png` | Grille 3x3 de KPI avec comparaison et mini-courbe | À adapter (produit réel) |
| Panze School SaaS | Dribbble | [lien](https://dribbble.com/shots/27090422-School-Management-SaaS-Admin-Dashboard-UI-UX-Design) | `05_dribbble_panze-school-admin-dashboard.png` | Dashboard école : encaissements vs dépenses, statut des frais payé/partiel/impayé, présences du jour | À adapter partiellement (concept) |
| Mercury Bill Pay (rappel) | Refero | voir écran 1 | `01_refero_mercury-billpay-overdue.png` | 3 KPI actionnables | À reprendre |

**GlossGenius Analytics**
- Ce qu'on voit : filtres période et personnel, KPI "Net revenue" en très grand avec barre empilée (services 63,7%, ventes 26,7%, pourboires 9,6%), puis "Projected revenue", "Service revenue", panneau "AI Growth Analyst".
- Pourquoi ça marche : un seul chiffre héros, sa composition juste en dessous.
- Transposition : héros = "Encaissé ce trimestre / attendu", barre = tranche 1 / 2 / 3, puis "Projeté fin de trimestre" (encaissé + échéances moratoires).
- Limites : panneau IA inutile au MVP.
- Verdict : **à adapter**. Produit réel.

**Lemon Squeezy grille KPI**
- Ce qu'on voit : 9 tuiles (commandes, revenus, revenu moyen, renouvellements, MRR, remboursements...), chacune avec valeur, "vs dernière période", sparkline, menu pour changer la métrique.
- Pourquoi ça marche : comparaison systématique, tuiles personnalisables.
- Limites : 9 tuiles, c'est trop pour un directeur de primaire. 4 suffisent.
- Verdict : **à adapter** (tuiles avec "vs même période l'an dernier"). Produit réel.

**Panze School SaaS (Dribbble)**
- Ce qu'on voit : longue barre latérale (multi-branche, examens CBSE, frais, RH...), histogrammes encaissements et dépenses, courbes, donuts revenus/dépenses, bloc "Fees Overview" (216 impayés, 8 partiels, 14 payés avec barres de progression), "Student Today Attendance", calendrier hebdomadaire.
- Pourquoi c'est intéressant : le bloc Payé / Partiel / Impayé est exactement le bon indicateur école.
- Limites : surcharge de graphiques, donuts peu lisibles, menu à 20 entrées. Concept non testé.
- Verdict : **à adapter** uniquement le bloc statut des frais, **à éviter** pour la densité. Fiabilité faible.

### Écran 6. Fiche employé, paie ou présences

| Nom | Site | URL | Capture | Description | Verdict |
|---|---|---|---|---|---|
| Aboard profil + congé | Refero | [lien](https://refero.design/pages/9797b9e9-cfd5-4787-bfe2-f0f5436157d7) | `06_refero_aboard-profile-register-timeoff.png` | Fiche employé + modal d'enregistrement de congé avec statut | À reprendre (produit réel) |
| Aboard calendrier absences | Refero | [lien](https://refero.design/pages/3255dd44-daca-49a4-b5e2-06fd6ed74623) | `06_refero_aboard-timeoff-calendar.png` | Calendrier mensuel des absences + demandes en attente | À adapter (produit réel) |
| Aboard rapport heures | Refero | [lien](https://refero.design/pages/dd8cd46c-9f42-487f-9027-5f8985afda33) | `06_refero_aboard-employee-report-hours.png` | Rapport mensuel : heures/jour, heures/semaine, jours travaillés | À adapter (produit réel) |

**Aboard profil + congé**
- Ce qu'on voit : fiche (onglets Profile / Time-off, carte à droite : rôle, département, lieu, responsable, date d'entrée, ancienneté, notes, documents), modal "Register time-off" : politique (Vacation), du / au, durée, commentaire, statut (Approved / Pending), liste jour par jour avec jours non travaillés grisés, "Requesting 5 days".
- Pourquoi ça marche : calcul visible des jours réels, statut choisi à la saisie (utile quand c'est le directeur qui saisit pour l'enseignant).
- Limites : à l'école, il faut voir les classes non couvertes (clast.io le promet).
- Verdict : **à reprendre**. Produit réel.

**Aboard calendrier absences**
- Ce qu'on voit : mois d'octobre, puces "Sick" et "Vacation" avec sablier d'attente, panneau droit Allowance / Pending / Requests.
- Verdict : **à adapter** en V2 (vue "qui est absent cette semaine"). Produit réel.

**Aboard rapport heures**
- Ce qu'on voit : "Monthly employee report", table nom / poste / heures quotidiennes / hebdomadaires / jours travaillés, filtre, colonnes, export, enregistrer, menu RH complet (Time-off, Onboarding, Documents, Vacation planner).
- Limites : pas de paie. Pour le primaire, une feuille de paie simple (salaire de base, primes, retenues, avances, net) suffit en V2.
- Verdict : **à adapter**. Produit réel. Aucun écran de bulletin de paie pertinent trouvé sur Refero (voir annexe).

### Écran 7. Inventaire et demandes de maintenance

| Nom | Site | URL | Capture | Description | Verdict |
|---|---|---|---|---|---|
| Shopify Products | Refero | [lien](https://refero.design/pages/dc0a9649-d270-4617-b686-6ebc5db4bf50) | `07_refero_shopify-products-inventory.png` | Liste d'articles avec statut et stock (rouge à 0), import/export | À reprendre (produit réel) |
| Mangomint produits | Refero | [lien](https://refero.design/pages/329c26c8-3a76-4f47-b6f9-5b06a0be92d1) | `07_refero_mangomint-products-side-form.png` | Table + formulaire de création en panneau latéral | À reprendre (produit réel) |
| Shopify bon de commande | Refero | [lien](https://refero.design/pages/3bba790d-e17d-4c69-a373-220df1c5b156) | `07_refero_shopify-create-purchase-order.png` | Création de bon de commande fournisseur | À adapter (produit réel) |
| Linear nouvelle demande | Refero | [lien](https://refero.design/pages/1bd10114-f1e0-4621-97d9-f84600e2389a) | `07_refero_linear-new-issue-modal.png` | Création rapide d'un ticket : titre, description, statut, priorité, assigné | À adapter (produit réel) |

**Shopify Products**
- Ce qu'on voit : Export / Import / More actions / Add product, bandeau d'analyses, onglets All / Active / Draft / Archived + vue personnalisée, table avec badge de statut et "0 in stock" en rouge, menu Inventory / Purchase orders / Transfers.
- Pourquoi ça marche : le stock nul saute aux yeux sans graphique.
- Verdict : **à reprendre** (craies, cahiers, uniformes, produits d'entretien). Produit réel.

**Mangomint produits**
- Ce qu'on voit : table catégorie / marque / nom / prix / stock, panneau droit "New Product" (catégorie, taxe, coût d'achat, "Track inventory").
- Pourquoi ça marche : on crée sans quitter la liste, rapide en saisie de masse.
- Verdict : **à reprendre** le panneau latéral pour toutes les créations simples (article, élève, employé). Produit réel.

**Shopify bon de commande**
- Ce qu'on voit : barre "Unsaved purchase order" avec Discard / Save as draft, fournisseur, destination, conditions de paiement, devise, livraison, ajout de produits, référence, note, récapitulatif des coûts.
- Limites : trop complet pour une école primaire. Un "bon d'achat" interne avec validation du directeur suffit.
- Verdict : **à adapter** en V3. Produit réel.

**Linear nouvelle demande**
- Ce qu'on voit : modal "New issue" : titre, description, suggestion de label, puces Todo / Priority / Assignee / label, pièce jointe, "Create more", "Save as draft".
- Transposition : "Signaler un problème" (table cassée salle CE1, fuite toilettes) avec photo depuis le téléphone, statut, assigné (agent d'entretien), priorité.
- Limites : aucun produit de maintenance d'équipements (CMMS) n'a été trouvé sur Refero.
- Verdict : **à adapter**. Produit réel.

### Écran 8. Vue parent sur mobile (solde, payer, demander un délai)

| Nom | Site | URL | Capture | Description | Verdict |
|---|---|---|---|---|---|
| PayPal aperçu client | Refero | [lien](https://refero.design/pages/228adfe9-9289-4ec3-bb4b-f96dbf91b9b9) | `08_refero_paypal-invoice-customer-preview.png` | Montant dû + choix du moyen de paiement à droite de la facture | À adapter (produit réel) |
| Klarna calculateur | Refero | [lien](https://refero.design/screens/ea521753-4796-4289-b83b-c112b4c37f92) | `08_refero_klarna-payment-calculator.png` | Simulation d'un paiement en 3 fois avec échéances visuelles | À reprendre (produit réel) |
| Copilot "reste à payer" | Refero | [lien](https://refero.design/screens/ac7f5248-e480-42a3-afb3-b181ec018677) | `08_refero_copilot-recurrings-left-to-pay.png` | Anneau "reste à payer / déjà payé" + échéances du mois | À adapter (produit réel) |
| Portail de paiement école | Dribbble | [lien](https://dribbble.com/shots/26467147-School-Payment-System-Seamless-Online-Enrollment-Fee-Payment) | `08_dribbble_school-payment-portal-steps.png` | Paiement sans login depuis un lien, en étapes numérotées jusqu'au reçu officiel | À reprendre l'idée (concept) |
| UITOP Mobile Money | Dribbble | [lien](https://dribbble.com/shots/27811056-Mobile-Money-Transfer-UX-for-Delayed-Transactions) | `08_dribbble_uitop-mobile-money-delayed-status.png` | Statuts de transaction en attente, "ne pas renvoyer", référence | À reprendre l'idée (concept d'agence) |

**PayPal aperçu client**
- Ce qu'on voit : bandeau "voici ce que verra votre client", facture à gauche (logo, adresses, montant, badge Draft), panneau droit collant : "Amount due", total, "Select funding source" (PayPal, Venmo, PayPal Credit, Pay Later, carte).
- Transposition : panneau "Payer" avec boutons MTN MoMo, Orange Money, "Payer à la caisse".
- Limites : sur mobile, le panneau droit passe en bas.
- Verdict : **à adapter**. Produit réel.

**Klarna calculateur**
- Ce qu'on voit : "Payment calculator", champ montant, "Pay in 3", trois cercles en portions (aujourd'hui, dans 30 jours, dans 60 jours) avec montant, APR 0%, intérêts "Free", total.
- Pourquoi ça marche : le parent comprend un échéancier en une image.
- Transposition : écran "Demander un délai" : le parent choisit 2 ou 3 versements proposés par l'école (dans les plafonds), voit les dates, envoie la demande.
- Verdict : **à reprendre**. Produit réel.

**Copilot "reste à payer"**
- Ce qu'on voit : anneau de progression avec "40 USD left to pay" et "2 757 USD paid so far", grille des échéances du mois avec montant, jour, coche quand payé.
- Transposition : en-tête de la vue parent : "Reste à payer : 45 000 FCFA / Déjà payé : 105 000 FCFA", puis une carte par enfant.
- Verdict : **à adapter**. Produit réel.

**Portail de paiement école (Dribbble)**
- Ce qu'on voit : description du concept : pas de login, le parcours démarre depuis un lien envoyé par l'école ; étapes : consulter les frais, choisir quels frais payer (première tranche obligatoire ou frais optionnels), payer, télécharger le reçu officiel. Page d'accueil avec date limite de paiement.
- Pourquoi c'est pertinent : le lien sans login est la bonne approche pour un parent qui reçoit une relance WhatsApp.
- Limites : visuel marketing chargé, l'école nommée est réelle mais le travail est celui d'une designer, concept non testé.
- Verdict : **à reprendre l'idée** du lien sans login et des étapes. Fiabilité faible.

**UITOP Mobile Money (Dribbble)**
- Ce qu'on voit : liste de transactions avec filtres All / Active / Needs action / Done, ligne "Document needed - Upload" ; détail : "Sent to receiving bank", heure de la dernière mise à jour, alerte "Don't send again while it's processing", arrivée estimée "non garantie", frais, référence.
- Pourquoi c'est pertinent : avec MoMo/OM, le paiement "en attente" est fréquent. Le parent doit voir "en cours de confirmation, ne repayez pas" pour éviter les doubles paiements.
- Limites : concept d'agence (basé sur un client réel selon le texte, implémentation non vérifiée).
- Verdict : **à reprendre l'idée** des statuts honnêtes et de la référence. Fiabilité moyenne.

---
## 4. Synthèse transversale

### 4.1 Patterns qui reviennent sur les écrans critiques [Observé sur les références, interprétation Déduite]

1. **KPI actionnables au-dessus d'une table filtrée par statut** (Mercury, Shopify, Panze). Le KPI est aussi un raccourci de filtre.
2. **Onglets de statut avec compteurs** (Mercury : Inbox / Needs Approval / Scheduled / Paid ; Shopify : All / Active / Draft / Archived ; UITOP : Needs action).
3. **Sélection multiple + actions groupées contextuelles** (PayPal). Indispensable pour relancer 40 parents.
4. **Panneau latéral** pour filtrer ou créer sans quitter la liste (PayPal filtres, Mangomint).
5. **Chronologie d'événements** sur l'objet (Stripe). Base de la traçabilité et des litiges.
6. **Échéancier = liste de lignes datées avec statut + "payé / reste dû"** (Square, Klarna, Copilot).
7. **Phrase de synthèse en langage naturel** sous un formulaire de montants (Square : "Request 0% of ... over 2 payments").
8. **Confirmation d'encaissement avec actions suivantes** (Square : nouvelle vente / envoyer / imprimer).
9. **Envoi par canal avec message éditable et aperçu** (Kitchen, Stripe).
10. **Relances = réglage planifié, pas action manuelle** (Lemon Squeezy, PayPal).
11. **Décision d'approbation à 3 issues** (Asana : approuver / demander des modifications / rejeter).
12. **Statuts de paiement honnêtes** quand la confirmation n'est pas instantanée (UITOP).

### 4.2 Flux idéal du moratoire [Déduit]

**Acteurs** : parent (demande), comptable (saisit ou instruit), directeur (valide), système (suit et relance).

**Étapes**
1. **Déclenchement** : le parent demande depuis le lien reçu (bouton "Demander un délai") ou le comptable saisit la demande au guichet (cas le plus fréquent au début).
2. **Proposition** : choix de la tranche concernée, motif (liste + texte libre), justificatif optionnel (photo), échéancier proposé (2 ou 3 versements datés, pattern Square/Klarna) avec phrase de synthèse ("45 000 FCFA en 3 versements : 15 000 le 10/11, 15 000 le 10/12, 15 000 le 10/01").
3. **Contrôle automatique des règles** (voir ci-dessous). Si hors plafond : la demande reste possible mais marquée "hors règle", validation directeur obligatoire.
4. **Instruction** : l'écran de décision montre à côté de la demande le solde de la famille, l'historique de paiements, les moratoires passés (honorés / rompus), le nombre d'enfants inscrits.
5. **Décision** : Approuver / Contre-proposer / Refuser (pattern Asana), commentaire obligatoire si refus ou contre-proposition.
6. **Notification** au parent (WhatsApp/SMS) avec le nouvel échéancier et un lien vers le détail.
7. **Suivi** : chaque versement attendu devient une échéance qui suit les relances du moratoire (J-2, J+1, J+5), pas les relances standards de la tranche.
8. **Clôture** : "Honoré" quand tout est payé, "Rompu" après X jours de retard sur une échéance du moratoire, avec alerte directeur.

**Statuts** : Brouillon, Soumis, En instruction, Contre-proposé, Approuvé (actif), Refusé, En retard, Honoré, Rompu, Annulé.

**Règles métier à prévoir (toutes paramétrables par école)**
- Plafonds : nombre maximum de versements, délai maximum (ex. pas au-delà de la fin du trimestre ou de l'année scolaire), montant minimum par versement, acompte minimum à la demande.
- Éligibilité : pas de nouveau moratoire si un moratoire précédent est "Rompu" dans l'année ; nombre maximum de moratoires par famille et par an.
- Circuit de validation : seuil de montant ou de durée au-dessus duquel le directeur valide (en dessous, le comptable peut valider).
- **Impact sur le solde** : le montant dû ne change pas ; seules les dates d'exigibilité changent. Le statut de l'élève passe de "En retard" à "Sous moratoire" tant que les versements du moratoire sont respectés. Les KPI doivent séparer "En retard" et "Sous moratoire" (sinon le directeur ne voit pas son vrai risque).
- Pénalités ou frais de retard : optionnels, désactivés par défaut.
- Conséquences scolaires (accès aux examens, remise des bulletins) : paramètre de l'école, jamais automatique sans validation humaine. Point sensible à valider avec des directeurs (non vérifié).
- Audit : chaque création, modification, décision et paiement horodatés avec l'utilisateur.

### 4.3 Adaptations nécessaires pour le Cameroun [Déduit]

- **Mobile Money** : MTN MoMo et Orange Money en moyens de paiement de premier niveau. V1 : saisie manuelle avec référence de transaction obligatoire (rapprochement par le comptable). V2 : paiement initié (push USSD ou lien) via un agrégateur, avec statut "en attente de confirmation" à la UITOP. Choix de l'agrégateur et frais : non vérifiés ici.
- **Espèces** : restent majoritaires au guichet [hypothèse à valider]. Journal de caisse et clôture journalière (qui a encaissé combien) pour limiter les fuites.
- **WhatsApp et SMS** : relances et reçus par WhatsApp (lien wa.me pré-rempli en V1, sans API ; API WhatsApp Business en V2), SMS en secours pour les parents sans smartphone.
- **Reçus** : PDF léger + impression ticket thermique 58/80 mm + numérotation officielle, mention du solde restant et du moyen de paiement.
- **Saisie rapide** : recherche de l'élève par nom ou matricule au clavier, encaissement en moins de 30 secondes, raccourcis, montants proposés (tranche restante).
- **Connexion lente** : pages légères, pas de graphiques lourds sur mobile, tolérance aux coupures (formulaire qui ne perd pas la saisie). Un mode hors ligne complet est coûteux : à réserver à l'encaissement si les tests terrain le justifient.
- **Multi-niveaux de classes** : SIL, CP, CE1, CE2, CM1, CM2 côté francophone ; Class 1 à 6 côté anglophone ; plusieurs sections par niveau. Libellés paramétrables (connaissance générale, à confirmer par école).
- **Bilinguisme** : interface FR et EN, et choix du sous-système par classe ou par établissement.
- **FCFA** : pas de décimales, séparateur de milliers par espace.
- **Prix** : en FCFA, par paliers d'effectif, payable par trimestre (comme Akateh) et en Mobile Money.

### 4.4 MVP école primaire [Déduit]

**À construire en premier (7 fonctions)**
1. Élèves, familles et classes (import Excel, fratries liées).
2. Plan de frais par classe : inscription + pension en tranches avec dates, remise fratrie.
3. Encaissement rapide (espèces / MoMo / OM avec référence) + reçu PDF/ticket + partage WhatsApp.
4. Liste élèves avec solde, statut et filtres + export.
5. Moratoire : saisie, règles, validation directeur, échéancier, suivi.
6. Relances groupées WhatsApp (lien pré-rempli) et SMS, modèles avec variables.
7. Tableau de bord directeur : attendu / encaissé / en retard / sous moratoire, par classe ; caisse du jour.

**À couper du MVP** : paie et RH (hors liste du personnel), inventaire et maintenance, bulletins et notes, application mobile native (un lien web suffit), intégration API Mobile Money (saisie manuelle d'abord), multi-sites, présences biométriques, IA.

[Challenge] Vos modules RH et matériel sont dans la vision, mais rien n'indique que le directeur paiera pour eux en premier. Validez d'abord que des écoles paient pour le recouvrement (préventes) avant de construire RH et inventaire.

### 4.5 Architecture de configurabilité [Déduit]

**Noyau commun (identique pour tous les types)**
- Organisation : groupe > établissement > site ; année académique ; périodes (type et nombre paramétrables).
- Personnes : identité unique (élève, parent/tuteur, employé), une personne peut avoir plusieurs rôles.
- Structure académique générique : niveaux > groupes (classe, section, promotion, cohorte) ; inscription = personne × groupe × année.
- Finance : plan de frais (lignes, tranches, échéances), compte élève (ledger : charges, paiements, ajustements, remises), paiements multi-moyens, reçus, moratoires, relances, caisse.
- Personnel : fiche employé, contrat, présences, congés (paie en module).
- Ressources matérielles : articles, mouvements de stock, actifs, demandes de maintenance.
- Transverse : rôles et permissions par établissement, audit, notifications (WhatsApp, SMS, email), modèles de documents, import/export.

**Modules spécifiques activables**
- Primaire : bulletins primaire FR/EN, cantine, transport (option).
- Secondaire : séquences/trimestres, coefficients, conseils de classe, bulletins secondaire FR/EN, examens officiels.
- Centre de formation : sessions et cohortes, paiement par module ou par session, attestations.
- Université : UE et crédits, semestres, LMD, relevés de notes, frais par crédit, bourses.

**Paramètres par établissement (jamais codés en dur)**
- Vocabulaire : élève / étudiant / apprenant / stagiaire ; classe / section / promotion / filière / cohorte.
- Types de période : trimestre, séquence, semestre, session.
- Barèmes : échelle de notes (sur 20, lettres, crédits), mentions.
- Frais : lignes, nombre de tranches, échéances, remises (fratrie, personnel, bourse), pénalités.
- Règles de moratoire : plafonds, éligibilité, seuils de validation.
- Modèles : reçus, messages de relance, bulletins.
- Langue et sous-système par établissement ou par classe.

**Ordre d'extension**
1. **Primaire** (MVP) : volume d'écoles privées, besoin de recouvrement aigu, structure simple.
2. **Secondaire** : même acheteur (souvent le même promoteur gère primaire et secondaire), mêmes mécaniques de frais, ticket plus élevé ; ajoute séquences et bulletins plus complexes.
3. **Centres de formation** : cycles courts, paiement par module, besoin de recouvrement fort ; peu de contraintes réglementaires de bulletins.
4. **Université** : crédits, LMD, ventes longues et institutionnelles ; à n'attaquer qu'avec un noyau éprouvé.

Ce qui changerait ma recommandation : si vos premiers entretiens montrent que les centres de formation paient plus vite et plus cher que les écoles, passez-les en deuxième.

### 4.6 Angles ouverts face à clast.io

| Angle | Vu ou supposé |
|---|---|
| Moratoires / échéanciers négociés : absents des pages clast.io | **Vu** (absence sur les pages lues ; présence dans le produit non vérifiée) |
| Mobile Money non mentionné, passerelles Stripe/PayPal mises en avant | **Vu** |
| Prix en USD et par branche | **Vu** |
| Interface française et sous-systèmes camerounais | **Non vérifié** (site en anglais) |
| Produit trop large et trop IA pour une école primaire à budget serré | **Supposé** |
| Support et onboarding local en présentiel (Douala, Yaoundé) comme avantage décisif | **Supposé** (à tester) |
| Prix en FCFA par trimestre, payable en Mobile Money | **Supposé** comme avantage, pratique déjà observée chez Akateh (50 000 FCFA / trimestre en Basic) |
| Reçu officiel imprimable et caisse journalière | **Supposé** (clast.io promet des reçus automatiques en ligne, pas vu de caisse) |

---
## 5. Analyse multi-établissements (étape 2)

Méthode : lecture des sites et documentations publiques. Aucune démo n'a été ouverte. Tout ce qui n'est pas cité ci-dessous est **non vérifié**.

| Produit | Segment | Adaptation au type | Structures académiques | Rôles, multi-sites | Notes et bulletins | Frais | Limites visibles |
|---|---|---|---|---|---|---|---|
| [clast.io](https://clast.io/product) | École, collège, université, instituts | Choix du type au calcul du prix ; "configurable per institution type, no custom development" | K-12, crédits, GPA, SAP, audits de diplôme (annoncés) | 11 rôles, branches cloisonnées par architecture, vue consolidée super admin | Barèmes personnalisés, bulletins auto | Factures, relances WhatsApp, bourses, fratrie, approbations | Pas de moratoire ni MoMo vus ; USD ; très large |
| [Akateh](https://akateh-home.pages.dev) | Cameroun : primaire, secondaire, professionnel, supérieur | Annonce le support des systèmes anglophone et francophone | Non détaillé | Multi-campus en offre Enterprise | Bulletins annoncés ; formats FR/EN non décrits | Collecte, suivi, facturation ; tranches et MoMo non mentionnés | Site très succinct ; prix : Basic 50 000 FCFA / trimestre, Advanced 150 000 FCFA / trimestre |
| [Fedena](https://fedena.com/) | Primaire, secondaire, collèges, instituts | Programmes (CBSE, ICSE, IB...) ; 50+ modules | Non détaillé sur la page | Lien "Multi School" ; article "Accounts Panel, Multi School Groups" | Exam & Gradebook | Paiement en ligne, amendes de retard, remises, suivi des impayés ("fee defaulters"), alertes parents ; échelonnement non mentionné | Orientation Inde ; Afrique non mentionnée ; prix non affichés |
| [OpenEduCat](https://openeducat.org/solutions/fees-management-for-colleges/) | Collèges, universités (base Odoo) | Assistant de configuration : années, termes, départements, cours, batches, activation de modules ([doc](https://newdoc.openeducat.org/getting-started/first-time-setup/)) | Cours + batches (sections), termes type semestre | Rôles par défaut ; facturation multi-campus multi-devises | Types d'évaluation par cours | Structures de frais par cours et année ([doc](https://newdoc.openeducat.org/fees/fee-structure/)) ; plans en 3, 4, 6 versements ou personnalisés, acompte, rappels J-7 et J-3, frais de retard après délai de grâce, blocages administratifs ; bourses et sponsors | Pensé enseignement supérieur occidental (ACH, aides fédérales) ; passerelles Paystack mais pas MoMo cité |
| [Classter](https://classter.com/student-information-system-academies) | Écoles, supérieur, académies et centres de formation | Personnalisation de la terminologie ([KB](https://help.classter.com/kb/basic-institution-set-up/terminology-customization-classter/), détail réservé aux clients) ; abonnement modulaire | Programmes, sessions d'enseignement, périodes académiques | Rôles copiables (titres d'articles) | Évaluation continue | Paiements en ligne via portail parent ; facturation par cours et échelonnement non décrits | Détails derrière login ; tarifs sur devis |

### Ce qui est commun à tous (le noyau) [Déduit des cinq produits]

Identité de la personne et inscription, structure "niveau > groupe" sous une année et des périodes, plan de frais lié à cette structure, compte financier par apprenant avec paiements et remises, relances, rôles et permissions, multi-sites, communication avec les familles.

### Ce qui diffère (modules spécifiques)

- Évaluation : notes sur 20 et bulletins (primaire/secondaire) vs crédits et GPA (supérieur) vs attestation de session (formation).
- Rythme : année + trimestres/séquences vs semestres vs sessions courtes à dates libres.
- Frais : pension par tranches (école) vs frais par crédit ou par semestre (université) vs prix par module ou session (formation).
- Payeur : parent (école) vs étudiant, sponsor ou entreprise (supérieur, formation).

### Ce qui doit être paramétrable plutôt que codé en dur

Vocabulaire (Classter le fait explicitement), types et nombre de périodes, structure des groupes, barèmes, lignes et tranches de frais, remises, règles de moratoire, modèles de documents, langue et sous-système. OpenEduCat montre la bonne granularité pour les frais (structure liée à cours + année, composants marqués obligatoire / remboursable / unique / par semestre).

### Spécificités Cameroun (bulletins, sous-systèmes)

- Akateh est le seul des cinq à **annoncer** les deux sous-systèmes ; le format des bulletins n'est pas décrit [Observé].
- Je n'ai pas trouvé de documentation produit décrivant les bulletins camerounais. Ma connaissance générale (secondaire francophone en séquences regroupées en trimestres, notes sur 20 et coefficients ; anglophone en terms avec grades) est **à vérifier** auprès des textes MINEDUB / MINESEC et de bulletins réels d'écoles cibles avant tout développement.
- Paiement des frais par Mobile Money : pratique déjà poussée par l'État pour certains frais publics (partenariat MINESEC et MTN Cameroon mentionné sur [minesec.gov.cm](https://www.minesec.gov.cm/web/index.php/en/infos/343-minesec-mtn-cameroon-partnership-2), contenu de la page non lu en détail).

---

## 6. Annexe

### 6.1 Journal de recherche

**Mobbin** (session connectée, plan gratuit)
- Bandeau observé : "Upgrade for full access beyond the 4 latest apps".
- Recherche "invoice" (Web, Screens) : la page de résultats est restée sur des blocs de chargement plus de 15 secondes, sans résultat. Considéré comme bloqué par le plan payant. Arrêt sur ce site, conformément à la consigne.

**Refero** (session connectée, Web apps et iOS apps, mode Screens)

| Requête | Résultat | Gardé ? |
|---|---|---|
| payment plan installments | Pages e-commerce BNPL (SeatGeek, Apple, Klarna) | Non |
| invoices table outstanding balance | Kitchen.co, Mapbox, PayPal, Intercom, Square | Oui |
| students list table | Teachable, Google Classroom | Oui (Teachable) |
| customers table payment status overdue | Mercury, PayPal, Square, Steel | Oui (Mercury) |
| record payment mark as paid | Square "Payment recorded", Wise, PayPal | Oui |
| add payment modal amount payment method cash | Formulaires de carte bancaire uniquement | Non |
| payment receipt | Square, GoFundMe, Shop, Teachable | Oui |
| invoice detail partially paid payment history | Stripe, Kitchen.co, PayPal | Oui (Stripe) |
| payment schedule installments due dates | Square échéancier (excellent), SeatGeek, Resume.io | Oui |
| approval request approve reject | Asana, Kitchen.co, Acctual, TravelPerk | Oui (Asana) |
| send payment reminder overdue invoice | Stripe, PayPal, Kitchen.co | Oui |
| automatic payment reminders settings schedule | PayPal, Lemon Squeezy, Mercury, Revolut | Oui |
| finance dashboard revenue collected outstanding KPI | RevenueCat, GlossGenius, Lemon Squeezy, Runey | Oui |
| school admin dashboard students classes | Google Classroom, Teachable, Quizlet (LMS) | Non |
| employee profile HR compensation | The Org, LinkedIn (profils publics) | Non |
| payroll run employees pay period | Aboard, ShareWillow, Square (page marketing) | Oui (Aboard) |
| time off leave request balance | Aboard | Oui |
| inventory stock items table low stock | Shopify, Mangomint, Retool, Square | Oui |
| maintenance request work order ticket | Linear, Intercom (aucun outil de maintenance) | Oui (Linear) |
| customers list balance due filter segment | PayPal, RevenueCat, Kitchen.co | Oui (PayPal filtres) |
| purchase order create supplier | Shopify | Oui |
| iOS : pay bill balance due | Revolut, PayPal, Klarna (état vide) | Partiel |
| iOS : upcoming payments installments pay now | Klarna calculateur, Copilot, Revolut | Oui |

Constat : les requêtes formulées en **objets fintech** (invoice, payment schedule, dunning) donnent de bien meilleurs résultats que les requêtes "school". Aucune requête en français n'a été testée sur Refero (base de produits anglophones).

**Dribbble** (session connectée)

| Requête | Résultat | Gardé ? |
|---|---|---|
| school fee management dashboard | Nombreux concepts et publicités d'éditeurs indiens | Oui (Panze) ; Kiaan Technology rejeté (vidéo publicitaire) |
| student fees payment list | Publicités ERP, concepts hors sujet | Oui (School Payment System) |
| mobile money payment app | Concepts fintech génériques | Oui (UITOP) |

**Pinterest** (session connectée)

| Requête | Résultat | Gardé ? |
|---|---|---|
| school fees payment app ui | Épingles d'éditeurs ERP indiens et concepts | Oui (facturation HIMS) |

**Recherche web (étape 2)** : "logiciel gestion scolaire Cameroun pension tranches Mobile Money", "school management software Africa francophone...", "Fedena fee management installments...", "OpenEduCat fees terms installments...", "Classter ... terminology", "Cameroon school management app bulletin francophone anglophone...". Les articles de kolonell.com sont apparus souvent mais n'ont pas pu être lus (erreur serveur).

### 6.2 Captures

| Fichier | URL |
|---|---|
| 00_clast_home.png | https://clast.io/ |
| 00_clast_finance-overview-mockup.png | https://clast.io/for-schools |
| 01_refero_mercury-billpay-overdue.png | https://refero.design/pages/82b4731f-3cf9-4790-9b3f-671b7d875fba |
| 01_refero_paypal-invoicing-table.png | https://refero.design/pages/65172468-3bd7-4f5a-b1ef-039631a628ff |
| 01_refero_paypal-invoicing-filters-sheet.png | https://refero.design/pages/e348104b-fd61-4f3a-8883-2f44981ea341 |
| 01_refero_teachable-students-list.png | https://refero.design/pages/bfec5414-633e-4a7f-b53d-d6eb7563c1f7 |
| 02_refero_square-payment-recorded.png | https://refero.design/pages/37d87de4-55ad-4cf9-a7ec-06198eca054c |
| 02_refero_square-receipt.png | https://refero.design/pages/9d861019-5ea2-46b3-b60f-d8bd4422f09f |
| 02_refero_stripe-invoice-detail-timeline.png | https://refero.design/pages/b176825e-b144-431f-aa4f-8dcf47104c65 |
| 02_refero_gofundme-receipt-modal.png | https://refero.design/pages/ff65cf95-ba0a-4f1f-acb3-ba51266c7ddb |
| 02_pinterest_hims-billing-quick-payment.png | https://www.pinterest.com/pin/1151866042220781026/ |
| 03_refero_square-payment-schedule-editor.png | https://refero.design/pages/e02168d9-b6af-4fb5-9213-d102c57738e4 |
| 03_refero_square-payment-schedule-client.png | https://refero.design/pages/df96828b-e340-4d10-96fd-2945b478e54c |
| 03_refero_asana-approval-task.png | https://refero.design/pages/b163b5b5-fbb5-49e9-9a1b-786f51252b70 |
| 04_refero_kitchen-send-invoice-channels.png | https://refero.design/pages/cfdace14-cce2-4bb8-a1bc-d209814db2c0 |
| 04_refero_lemonsqueezy-dunning-sequence.png | https://refero.design/pages/20af7612-c8ee-476c-bbff-a4251a23c874 |
| 04_refero_paypal-auto-reminders.png | https://refero.design/pages/c32b0b20-9587-40bc-a2ad-5fb7d4272adc |
| 04_refero_stripe-send-invoice-confirm.png | https://refero.design/pages/fd39bdae-f76e-4643-bba7-0593136abdb5 |
| 04_refero_square-payment-request-page.png | https://refero.design/pages/1c27a14d-2c42-4db0-a548-c0f53bcf2114 |
| 05_refero_glossgenius-analytics.png | https://refero.design/pages/4064fa00-4e9e-48e2-a487-14ee88b64e65 |
| 05_refero_lemonsqueezy-kpi-grid.png | https://refero.design/pages/16d1663f-9117-46d7-b59c-e634c537d8a4 |
| 05_dribbble_panze-school-admin-dashboard.png | https://dribbble.com/shots/27090422-School-Management-SaaS-Admin-Dashboard-UI-UX-Design |
| 06_refero_aboard-profile-register-timeoff.png | https://refero.design/pages/9797b9e9-cfd5-4787-bfe2-f0f5436157d7 |
| 06_refero_aboard-timeoff-calendar.png | https://refero.design/pages/3255dd44-daca-49a4-b5e2-06fd6ed74623 |
| 06_refero_aboard-employee-report-hours.png | https://refero.design/pages/dd8cd46c-9f42-487f-9027-5f8985afda33 |
| 07_refero_shopify-products-inventory.png | https://refero.design/pages/dc0a9649-d270-4617-b686-6ebc5db4bf50 |
| 07_refero_mangomint-products-side-form.png | https://refero.design/pages/329c26c8-3a76-4f47-b6f9-5b06a0be92d1 |
| 07_refero_shopify-create-purchase-order.png | https://refero.design/pages/3bba790d-e17d-4c69-a373-220df1c5b156 |
| 07_refero_linear-new-issue-modal.png | https://refero.design/pages/1bd10114-f1e0-4621-97d9-f84600e2389a |
| 08_refero_paypal-invoice-customer-preview.png | https://refero.design/pages/228adfe9-9289-4ec3-bb4b-f96dbf91b9b9 |
| 08_refero_klarna-payment-calculator.png | https://refero.design/screens/ea521753-4796-4289-b83b-c112b4c37f92 |
| 08_refero_copilot-recurrings-left-to-pay.png | https://refero.design/screens/ac7f5248-e480-42a3-afb3-b181ec018677 |
| 08_dribbble_school-payment-portal-steps.png | https://dribbble.com/shots/26467147-School-Payment-System-Seamless-Online-Enrollment-Fee-Payment |
| 08_dribbble_uitop-mobile-money-delayed-status.png | https://dribbble.com/shots/27811056-Mobile-Money-Transfer-UX-for-Delayed-Transactions |

Note : les captures sont des copies d'écran de consultation (fenêtre du navigateur), pas des téléchargements haute résolution.

### 6.3 Consultés mais non retenus

- Revolut iOS demande de paiement ([lien](https://refero.design/screens/8abe7c20-4388-488f-948b-f975869bed2f)) : statut "Pending" + expiration du lien en 9 jours ; doublon avec UITOP et Square.
- Vedmarg, app parent "Fees Structure" ([épingle](https://www.pinterest.com/pin/1011691503785877268/)) : exemple à éviter (liste de chiffres sans hiérarchie, jargon "Head discount", "Gross total").
- Klarna iOS "Payments" état vide, Steel "Confirming your payment", Square Payroll (page marketing), Kiaan Technology (vidéo publicitaire), Google Classroom (LMS).
- Mercury "Checkout UI" (21ecba85...) : la page bloquait les captures, abandonnée.

### 6.4 Ce qui n'a pas pu être consulté et pourquoi

- **Mobbin** : plan gratuit, recherche sans résultats chargés. Pour compléter : compte Pro, puis rechercher Wave, QuickBooks, Xero, Gusto, Rippling (absents de Refero).
- **Behance** : non consulté, par manque de temps après les difficultés de capture. Faible valeur attendue (concepts).
- **Démo clast.io** : réservée au contact commercial.
- **Documentation détaillée Classter** : derrière connexion client.
- **Articles kolonell.com** (listes de logiciels en Afrique francophone) : erreur serveur à la lecture.
- **Gusto, Rippling, Pennylane, Wave, QuickBooks, Xero** : non trouvés sur Refero avec mes requêtes ; écrans de bulletin de paie et de rapprochement bancaire non couverts.
- **Bulletins scolaires camerounais réels** : aucun modèle consulté.
- Incident technique : les captures Chrome ont échoué par intermittence (fenêtre non active). Contourné en travaillant dans l'onglet Refero visible.
