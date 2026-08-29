'use client';

import React, { useState, useRef, useTransition } from 'react';
import { explainPrescription, ExplainPrescriptionOutput } from '@/ai/flows/explain-prescription';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, FileUp, Info, Loader2, Pill, Repeat, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

export function PrescriptionExplainer() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ExplainPrescriptionOutput | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPreview(dataUrl);
        setResult(null); // Clear previous result
        startTransition(async () => {
          try {
            const output = await explainPrescription({ prescriptionImage: dataUrl });
            setResult(output);
          } catch (error) {
            console.error('Error explaining prescription:', error);
            toast({
              variant: 'destructive',
              title: 'Analysis Failed',
              description: 'Could not analyze the prescription. Please try a clearer image.',
            });
            setPreview(null);
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setResult(null);
    setPreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  const renderContent = () => {
    if (isPending) {
      return <LoadingState preview={preview} />;
    }
    if (result && preview) {
      return <ResultState result={result} preview={preview} onReset={handleReset} />;
    }
    return <InitialState onUploadClick={handleUploadClick} />;
  };

  return (
    <div>
      <Input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      {renderContent()}
    </div>
  );
}

function InitialState({ onUploadClick }: { onUploadClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
      <FileUp className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">Upload a prescription photo</h3>
      <p className="mt-2 text-sm text-muted-foreground">We&apos;ll analyze it and provide a simple explanation.</p>
      <Button onClick={onUploadClick} className="mt-6">
        Upload Image
      </Button>
    </div>
  );
}

function LoadingState({ preview }: { preview: string | null }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h3 className="font-headline text-lg font-semibold mb-2">Uploaded Image</h3>
                <div className="aspect-video w-full overflow-hidden rounded-lg border p-2">
                    {preview && <Image src={preview} alt="Prescription preview" width={600} height={400} className="object-contain w-full h-full" />}
                </div>
            </div>
            <div>
                 <h3 className="font-headline text-lg font-semibold mb-2">Analyzing...</h3>
                 <div className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                            <Info className="h-5 w-5 text-primary" />
                            <CardTitle className="text-base font-medium">Explanation</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <Skeleton className="h-4 w-full mb-2" />
                           <Skeleton className="h-4 w-4/5" />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                            <Pill className="h-5 w-5 text-primary" />
                            <CardTitle className="text-base font-medium">Dosage</CardTitle>
                        </CardHeader>
                        <CardContent><Skeleton className="h-4 w-1/2" /></CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                            <Repeat className="h-5 w-5 text-primary" />
                            <CardTitle className="text-base font-medium">Frequency</CardTitle>
                        </CardHeader>
                        <CardContent><Skeleton className="h-4 w-3/4" /></CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                            <AlertCircle className="h-5 w-5 text-primary" />
                            <CardTitle className="text-base font-medium">Potential Side Effects</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-full mb-2" />
                           <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                    </Card>
                 </div>
            </div>
        </div>
    );
}

function ResultState({ result, preview, onReset }: { result: ExplainPrescriptionOutput, preview: string, onReset: () => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-headline text-lg font-semibold">Uploaded Image</h3>
                <Button variant="outline" size="sm" onClick={onReset}>
                    Analyze Another
                </Button>
            </div>
            <div className="aspect-video w-full overflow-hidden rounded-lg border p-2">
                <Image src={preview} alt="Prescription" width={600} height={400} className="object-contain w-full h-full" />
            </div>
        </div>
        <div>
            <h3 className="font-headline text-lg font-semibold mb-2">AI Explanation</h3>
            <div className="space-y-4">
                 <InfoCard icon={Info} title="Explanation" content={result.explanation} />
                 <InfoCard icon={Pill} title="Dosage" content={result.dosage} />
                 <InfoCard icon={Repeat} title="Frequency" content={result.frequency} />
                 <InfoCard icon={AlertCircle} title="Potential Side Effects" content={result.potentialSideEffects} />
            </div>
        </div>
    </div>
  );
}

function InfoCard({ icon: Icon, title, content }: { icon: React.ElementType, title: string, content: string }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                <Icon className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">{content}</p>
            </CardContent>
        </Card>
    );
}
